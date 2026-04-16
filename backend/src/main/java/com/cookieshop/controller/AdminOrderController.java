package com.cookieshop.controller;

import com.cookieshop.dto.OrderDto;
import com.cookieshop.entity.Order;
import com.cookieshop.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public List<OrderDto> getAllOrders() {
        return orderService.getAllOrders();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderDto> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        Order.OrderStatus status;
        try {
            status = Order.OrderStatus.valueOf(request.status());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Statut invalide : " + request.status() + ". Valeurs acceptées : PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED");
        }
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    public record UpdateStatusRequest(String status) {}
}
