package com.cookieshop.controller;

import com.cookieshop.service.ShopStatusService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/shop")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminShopController {
    private final ShopStatusService shopStatusService;

    @PatchMapping("/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@RequestBody UpdateShopStatusRequest request) {
        shopStatusService.setSalesOpen(request.salesOpen());
        shopStatusService.setNextOpeningAt(parseDateTime(request.nextOpeningAt()));
        if (request.deliveryDatesInsep() != null) {
            shopStatusService.setInsepDeliverySlots(parseDeliverySlots(request.deliveryDatesInsep()));
        }
        if (request.deliveryDatesPickup() != null) {
            shopStatusService.setPickupDeliverySlots(parseDeliverySlots(request.deliveryDatesPickup()));
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("salesOpen", shopStatusService.isSalesOpen());
        payload.put("nextOpeningAt", shopStatusService.getNextOpeningAt());
        payload.put("deliveryDatesInsep", shopStatusService.getInsepDeliverySlots().stream().map(Object::toString).collect(Collectors.toList()));
        payload.put("deliveryDatesPickup", shopStatusService.getPickupDeliverySlots().stream().map(Object::toString).collect(Collectors.toList()));
        return ResponseEntity.ok(payload);
    }

    private LocalDateTime parseDateTime(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }
        String value = rawValue.trim();
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ignored) {
        }
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDateTime.ofInstant(Instant.parse(value), ZoneId.systemDefault());
        } catch (DateTimeParseException ignored) {
        }
        throw new IllegalArgumentException("Format de date invalide. Utilisez yyyy-MM-ddTHH:mm");
    }

    private List<LocalDateTime> parseDeliverySlots(List<String> rawSlots) {
        if (rawSlots == null || rawSlots.isEmpty()) {
            return List.of();
        }
        List<LocalDateTime> parsed = new ArrayList<>();
        for (String raw : rawSlots) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            parsed.add(ShopStatusService.parseDeliverySlotString(raw.trim()));
        }
        return parsed.stream().distinct().sorted().collect(Collectors.toList());
    }

    public record UpdateShopStatusRequest(
            @NotNull Boolean salesOpen,
            String nextOpeningAt,
            List<String> deliveryDatesInsep,
            List<String> deliveryDatesPickup
    ) {}
}
