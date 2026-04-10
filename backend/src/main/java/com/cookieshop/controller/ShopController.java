package com.cookieshop.controller;

import com.cookieshop.service.ShopStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {
    private final ShopStatusService shopStatusService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("salesOpen", shopStatusService.isSalesOpen());
        payload.put("nextOpeningAt", shopStatusService.getNextOpeningAt());
        payload.put("deliveryDates", shopStatusService.getDeliveryDates().stream().map(Object::toString).collect(Collectors.toList()));
        return ResponseEntity.ok(payload);
    }
}
