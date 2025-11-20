package com.soa.busservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket configuration for real-time GPS location streaming.
 * Enables WebSocket endpoints for browser-based real-time tracking.
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketConfigurer {
    
    private final GpsLocationWebSocketHandler gpsLocationWebSocketHandler;
    
    /**
     * Register WebSocket handler for GPS location streaming.
     * Client connects to ws://localhost:8080/ws/gps-tracking
     */
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(gpsLocationWebSocketHandler, "/ws/gps-tracking")
                .setAllowedOrigins("*");
        
        log.info("WebSocket handler registered at /ws/gps-tracking for real-time GPS streaming");
    }
}
