package com.cookieshop.service;

import com.cookieshop.entity.ShopSettings;
import com.cookieshop.repository.ShopSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopStatusService {
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

    @Transactional(readOnly = true)
    public List<LocalDate> getDeliveryDates() {
        String raw = getSettings().getDeliveryDatesCsv();
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(v -> !v.isBlank())
                .map(LocalDate::parse)
                .distinct()
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toList());
    }

    @Transactional
    public void setNextOpeningAt(LocalDateTime nextOpeningAt) {
        ShopSettings settings = getSettings();
        settings.setNextOpeningAt(nextOpeningAt);
        shopSettingsRepository.save(settings);
    }

    @Transactional
    public void setDeliveryDates(List<LocalDate> deliveryDates) {
        ShopSettings settings = getSettings();
        String csv = (deliveryDates == null ? List.<LocalDate>of() : deliveryDates).stream()
                .distinct()
                .sorted(Comparator.naturalOrder())
                .map(LocalDate::toString)
                .collect(Collectors.joining(","));
        settings.setDeliveryDatesCsv(csv);
        shopSettingsRepository.save(settings);
    }

    @Transactional
    public void ensureInitialized() {
        getSettings();
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
                        .build()
        );
        return Objects.requireNonNull(created);
    }
}
