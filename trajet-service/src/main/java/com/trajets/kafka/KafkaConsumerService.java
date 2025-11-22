package com.trajets.kafka;

import com.trajets.event.LineChangeEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class KafkaConsumerService {

    @KafkaListener(topics = "bus.location.updates", groupId = "trajet-service-group")
    public void consumeBusLocationUpdate(Map<String, Object> message) {
        try {
            log.info("Received bus location update: Bus {} at coordinates ({}, {})", 
                message.get("busNumber"), 
                message.get("latitude"), 
                message.get("longitude"));
            
            // TODO: Process location update - calculate ETA, detect delays, etc.
            
        } catch (Exception e) {
            log.error("Error processing bus location update", e);
        }
    }

    @KafkaListener(topics = "bus.status.changes", groupId = "trajet-service-group")
    public void consumeBusStatusChange(Map<String, Object> message) {
        try {
            log.info("Received bus status change: Bus {} on line {} changed from {} to {}", 
                message.get("busNumber"),
                message.get("lineCode"),
                message.get("oldStatus"),
                message.get("newStatus"));
            
            // TODO: Process status change - alert if bus goes inactive, update service availability
            
        } catch (Exception e) {
            log.error("Error processing bus status change", e);
        }
    }
}
