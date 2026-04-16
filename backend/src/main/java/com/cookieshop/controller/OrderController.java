package com.cookieshop.controller;

import com.cookieshop.dto.BoxOrderDto;
import com.cookieshop.dto.CartItemDto;
import com.cookieshop.dto.OrderDto;
import com.cookieshop.entity.Order;
import com.cookieshop.service.OrderService;
import com.cookieshop.service.PayPalService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class OrderController {

    private final OrderService orderService;
    private final PayPalService payPalService;

    @Value("${paypal.client-id:}")
    private String paypalClientId;

    @GetMapping("/paypal/config")
    public ResponseEntity<Map<String, Object>> getPayPalConfig() {
        return ResponseEntity.ok(Map.of(
                "enabled", payPalService.isEnabled(),
                "clientId", paypalClientId != null ? paypalClientId : ""
        ));
    }

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("Authentification requise");
        }
        Long userId = (Long) authentication.getPrincipal();
        OrderDto order = orderService.createOrder(
                userId,
                request.cartItems(),
                request.boxes(),
                request.shippingAddress(),
                request.deliveryDate(),
                request.paymentMethod(),
                request.promoCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @PostMapping("/paypal/capture")
    public ResponseEntity<OrderDto> capturePayPal(
            @RequestBody CapturePayPalRequest request,
            Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("Authentification requise");
        }
        Long userId = (Long) authentication.getPrincipal();
        OrderDto order = orderService.capturePayPalOrder(userId, request.paypalOrderId());
        return ResponseEntity.ok(order);
    }

    @GetMapping
    public List<OrderDto> getMyOrders(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("Authentification requise");
        }
        Long userId = (Long) authentication.getPrincipal();
        return orderService.getOrdersByUser(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrder(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("Authentification requise");
        }
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getOrderById(id, userId));
    }

    public record CreateOrderRequest(
            @Valid
            List<CartItemDto> cartItems,

            @Valid
            List<BoxOrderDto> boxes,

            @NotBlank(message = "Le mode de livraison ou de retrait est obligatoire")
            String shippingAddress,

            @NotNull(message = "La date et l'heure de livraison sont obligatoires")
            LocalDateTime deliveryDate,

            @NotNull(message = "La méthode de paiement est obligatoire")
            Order.PaymentMethod paymentMethod,

            /** Code promo optionnel (recalcul côté serveur). */
            String promoCode
    ) {}

    public record CapturePayPalRequest(String paypalOrderId) {}
}
