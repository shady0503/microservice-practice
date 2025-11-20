package com.soa.busservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.soa.busservice.dto.kafka.GpsRawLocationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for streaming real-time GPS location data to connected clients.
 * 
 * Maintains a pool of connected WebSocket sessions and broadcasts GPS events
 * from Kafka to all connected frontend clients in real-time.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GpsLocationWebSocketHandler extends TextWebSocketHandler {
    
    // Thread-safe set to track all connected WebSocket sessions
    private static final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    private final ObjectMapper objectMapper;
    
    /**
     * Handle new WebSocket connection.
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        log.info("WebSocket client connected. Total connections: {}", sessions.size());
        
        // Send welcome message
        String welcomeMessage = objectMapper.writeValueAsString(
                new WebSocketMessage("CONNECTION", "Connected to GPS Tracking WebSocket")
        );
        session.sendMessage(new TextMessage(welcomeMessage));
    }
    
    /**
     * Handle WebSocket disconnection.
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) 
            throws Exception {
        sessions.remove(session);
        log.info("WebSocket client disconnected. Total connections: {}", sessions.size());
    }
    
    /**
     * Broadcast GPS location update to all connected WebSocket clients.
     * This method is called via Kafka listener to receive GPS events
     * and forward them to the frontend in real-time.
     * 
     * @param gpsEvent GPS location event from Kafka
     */
    @KafkaListener(
            topicPattern = "gps\\.line\\..*",
            groupId = "websocket-gps-consumer",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void broadcastGpsLocation(GpsRawLocationEvent gpsEvent) {
        if (sessions.isEmpty()) {
            return; // No clients connected, skip broadcasting
        }
        
        try {
            String gpsMessage = objectMapper.writeValueAsString(
                    new WebSocketMessage("GPS_UPDATE", gpsEvent)
            );
            
            TextMessage textMessage = new TextMessage(gpsMessage);
            
            // Broadcast to all connected clients
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        log.warn("Failed to send message to client {}: {}", 
                                session.getId(), e.getMessage());
                        // Remove unresponsive session
                        sessions.remove(session);
                    }
                }
            }
            
            log.debug("Broadcasted GPS update to {} clients", sessions.size());
            
        } catch (Exception e) {
            log.error("Error broadcasting GPS location: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Wrapper class for WebSocket messages with type and payload.
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class WebSocketMessage {
        private String type;      // MESSAGE_TYPE: CONNECTION, GPS_UPDATE, ERROR, etc.
        private Object payload;   // The actual data (GPS event or message text)
        private Long timestamp;   // Message timestamp
        
        public WebSocketMessage(String type, Object payload) {
            this.type = type;
            this.payload = payload;
            this.timestamp = System.currentTimeMillis();
        }
    }
    
    /**
     * Get current number of connected WebSocket clients.
     */
    public int getConnectedClientsCount() {
        return sessions.size();
    }
}
