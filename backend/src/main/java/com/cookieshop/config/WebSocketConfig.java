package com.cookieshop.config;

import com.cookieshop.websocket.AdminSubscriptionChannelInterceptor;
import com.cookieshop.websocket.JwtHandshakeHandler;
import com.cookieshop.websocket.JwtWebSocketHandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtWebSocketHandshakeInterceptor jwtHandshakeInterceptor;
    private final AdminSubscriptionChannelInterceptor adminSubscriptionChannelInterceptor;

    @Value("${cors.allowed-origins:http://localhost:4200}")
    private String allowedOrigins;

    private final JwtHandshakeHandler jwtHandshakeHandler = new JwtHandshakeHandler();

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        for (int i = 0; i < origins.length; i++) {
            origins[i] = origins[i].trim();
        }
        registry.addEndpoint("/ws")
                .setHandshakeHandler(jwtHandshakeHandler)
                .addInterceptors(jwtHandshakeInterceptor)
                .setAllowedOrigins(origins)
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(adminSubscriptionChannelInterceptor);
    }
}
