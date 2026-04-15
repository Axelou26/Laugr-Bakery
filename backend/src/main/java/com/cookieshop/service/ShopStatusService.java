package com.cookieshop.service;

import com.cookieshop.entity.ShopSettings;
import com.cookieshop.repository.ShopSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopStatusService {
    /** Fuseau utilisé pour interpréter les dates ISO avec offset (Z, +02:00) envoyées par le client. */
    public static final ZoneId SHOP_ZONE = ZoneId.of("Europe/Paris");
    private static final long SETTINGS_ID = 1L;
    private final ShopSettingsRepository shopSettingsRepository;

    @Transactional(readOnly = true)
    public boolean isSalesOpen() {
        return getSettings().isSalesOpen();
    }

    @Transactional
    public void setSalesOpen(boolean salesOpen) {
        ShopSettings settings = getSettings();
        settings.setSalesOpen(salesOpen);
        if (salesOpen) {
            settings.setNextOpeningAt(null);
        }
        shopSettingsRepository.save(settings);
    }

    @Transactional(readOnly = true)
    public LocalDateTime getNextOpeningAt() {
        return getSettings().getNextOpeningAt();
    }

    /**
     * Créneaux livraison INSEP (date + heure). Anciennes valeurs « date seule » (yyyy-MM-dd) → minuit local.
     */
    @Transactional(readOnly = true)
    public List<LocalDateTime> getInsepDeliverySlots() {
        return parseSlotsCsv(getSettings().getDeliveryDatesCsv());
    }

    @Transactional(readOnly = true)
    public List<LocalDateTime> getPickupDeliverySlots() {
        return parseSlotsCsv(getSettings().getDeliveryPickupDatesCsv());
    }

    @Transactional
    public void setNextOpeningAt(LocalDateTime nextOpeningAt) {
        ShopSettings settings = getSettings();
        settings.setNextOpeningAt(nextOpeningAt);
        shopSettingsRepository.save(settings);
    }

    @Transactional
    public void setInsepDeliverySlots(List<LocalDateTime> slots) {
        ShopSettings settings = getSettings();
        settings.setDeliveryDatesCsv(slotsToCsv(slots));
        shopSettingsRepository.save(settings);
    }

    @Transactional
    public void setPickupDeliverySlots(List<LocalDateTime> slots) {
        ShopSettings settings = getSettings();
        settings.setDeliveryPickupDatesCsv(slotsToCsv(slots));
        shopSettingsRepository.save(settings);
    }

    @Transactional
    public void ensureInitialized() {
        getSettings();
    }

    private static List<LocalDateTime> parseSlotsCsv(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(v -> !v.isBlank())
                .map(ShopStatusService::parseSingleSlot)
                .distinct()
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toList());
    }

    public static LocalDateTime parseDeliverySlotString(String s) {
        try {
            if (s.length() == 10) {
                return LocalDate.parse(s).atStartOfDay();
            }
            return LocalDateTime.parse(s);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Créneau invalide (attendu yyyy-MM-dd ou yyyy-MM-ddTHH:mm) : " + s);
        }
    }

    /**
     * Parse la date de livraison reçue en JSON (souvent ISO-8601). Accepte les formes avec Z ou décalage,
     * converties en heure locale boutique pour comparaison avec les créneaux configurés.
     */
    public static LocalDateTime parseClientDeliveryDate(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("La date et l'heure de livraison sont obligatoires");
        }
        String s = raw.trim();
        try {
            return OffsetDateTime.parse(s).atZoneSameInstant(SHOP_ZONE).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            // date/heure « naïves » (sans fuseau), comme les créneaux renvoyés par l’API
        }
        return parseDeliverySlotString(s);
    }

    private static LocalDateTime parseSingleSlot(String s) {
        return parseDeliverySlotString(s);
    }

    private static String slotsToCsv(List<LocalDateTime> slots) {
        if (slots == null || slots.isEmpty()) {
            return "";
        }
        return slots.stream()
                .distinct()
                .sorted(Comparator.naturalOrder())
                .map(LocalDateTime::toString)
                .collect(Collectors.joining(","));
    }

    private ShopSettings getSettings() {
        ShopSettings existing = shopSettingsRepository.findById(SETTINGS_ID).orElse(null);
        if (existing != null) {
            return existing;
        }
        ShopSettings created = shopSettingsRepository.save(
                ShopSettings.builder()
                        .id(SETTINGS_ID)
                        .salesOpen(true)
                        .nextOpeningAt(null)
                        .deliveryDatesCsv("")
                        .deliveryPickupDatesCsv("")
                        .build()
        );
        return Objects.requireNonNull(created);
    }
}
