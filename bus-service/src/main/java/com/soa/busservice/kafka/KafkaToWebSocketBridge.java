package com.soa.busservice.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.soa.busservice.config.GpsWebSocketHandler;
import com.soa.busservice.event.BusLocationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaToWebSocketBridge {

    private final GpsWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "bus.location.updates", groupId = "ws-bridge")
    public void bridgeLocationToWebSocket(String message) { // Accept String
        try {
            // 1. Manually parse the incoming JSON String
            BusLocationEvent event = objectMapper.readValue(message, BusLocationEvent.class);

            // 2. Format for Frontend
            Map<String, Object> gpsData = new HashMap<>();
            gpsData.put("busId", event.getBusId());
            gpsData.put("busMatricule", event.getBusNumber());
            gpsData.put("lineNumber", event.getLineCode());
            gpsData.put("latitude", event.getLatitude());
            gpsData.put("longitude", event.getLongitude());
            gpsData.put("speed", event.getSpeed());
            gpsData.put("heading", event.getHeading());

            Map<String, Object> wsMessage = new HashMap<>();
            wsMessage.put("type", "GPS_UPDATE");
            wsMessage.put("payload", gpsData);

            // 3. Broadcast
            webSocketHandler.broadcast(objectMapper.writeValueAsString(wsMessage));
            
        } catch (Exception e) {
            log.error("Error bridging location update: {}", e.getMessage());
        }
    }
}