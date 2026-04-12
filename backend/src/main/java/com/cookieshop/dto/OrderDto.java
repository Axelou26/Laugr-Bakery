package com.cookieshop.dto;

import com.cookieshop.entity.Order;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDto {

    private Long id;
    private Long userId;
    private String customerEmail;
    private String customerName;
    private List<OrderItemDto> items;
    private BigDecimal totalAmount;
    private Order.OrderStatus status;
    private LocalDateTime createdAt;
    private String shippingAddress;
    private LocalDateTime deliveryDate;
    private Order.PaymentMethod paymentMethod;
    private String paypalOrderId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDto {
        private Long cookieId;
        private String cookieName;
        private int quantity;
        private BigDecimal unitPrice;
    }
}
