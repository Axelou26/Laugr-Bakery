package com.cookieshop.websocket;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Component
public class AdminSubscriptionChannelInterceptor implements ChannelInterceptor {

    private static final String ADMIN_ORDERS_TOPIC = "/topic/admin/orders";

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() != StompCommand.SUBSCRIBE) {
            return message;
        }
        String dest = accessor.getDestination();
        if (dest == null || !ADMIN_ORDERS_TOPIC.equals(dest)) {
            return message;
        }
        Principal user = accessor.getUser();
        if (!(user instanceof Authentication auth)) {
            throw new org.springframework.messaging.MessageDeliveryException("Abonnement refusé");
        }
        boolean admin = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
        if (!admin) {
            throw new org.springframework.messaging.MessageDeliveryException("Réservé aux administrateurs");
        }
        return message;
    }
}
