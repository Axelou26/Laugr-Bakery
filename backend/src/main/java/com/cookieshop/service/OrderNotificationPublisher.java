package com.cookieshop.service;

import com.cookieshop.dto.OrderDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderNotificationPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyNewOrder(OrderDto order) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "NEW_ORDER");
        payload.put("orderId", order.getId());
        payload.put("totalAmount", order.getTotalAmount());
        payload.put("customerName", order.getCustomerName() != null ? order.getCustomerName() : "");
        payload.put("status", order.getStatus().name());
        messagingTemplate.convertAndSend("/topic/admin/orders", payload);
    }

    public void notifyOrderStatusToUser(OrderDto order) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "ORDER_STATUS");
        payload.put("orderId", order.getId());
        payload.put("status", order.getStatus().name());
        messagingTemplate.convertAndSendToUser(
                String.valueOf(order.getUserId()),
                "/queue/order-status",
                payload
        );
    }
}
