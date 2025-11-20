package com.soa.busservice.kafka;

import com.soa.busservice.dto.kafka.GpsRawLocationEvent;
import com.soa.busservice.service.BusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Kafka consumer for GPS location updates.
 * Consumes from gps.line.* topics (one per bus line), validates incoming GPS data,
 * and updates bus positions in the database.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GpsLocationConsumer {
    
    private final BusService busService;
    
    // Configuration constants
    private static final long MAX_GPS_AGE_MINUTES = 60;
    private static final double MIN_LATITUDE = -90.0;
    private static final double MAX_LATITUDE = 90.0;
    private static final double MIN_LONGITUDE = -180.0;
    private static final double MAX_LONGITUDE = 180.0;
    
    /**
     * Consume GPS location events from gps.line.* Kafka topics (one per bus line).
     * Validates coordinates, timestamp, and bus existence before persisting.
     * 
     * @param gpsEvent Raw GPS location event
     * @param partition Kafka partition
     * @param offset Kafka message offset
     * @param topic The specific topic this message was received from
     * @param acknowledgment Manual acknowledgment handler
     */
    @KafkaListener(
            topicPattern = "gps\\.line\\..*",
            groupId = "bus-service-gps-consumer",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeGpsLocation(
            @Payload GpsRawLocationEvent gpsEvent,
            @Header(value = "kafka_receivedPartitionId", required = false) int partition,
            @Header(value = "kafka_offset", required = false) long offset,
            @Header(value = "kafka_receivedTopic", required = false) String topic,
            Acknowledgment acknowledgment) {
        
        log.debug("Received GPS event for bus {} from topic {}", gpsEvent.getBusId(), topic);
        
        try {
            // Validate GPS event
            if (!validateGpsEvent(gpsEvent)) {
                log.warn("GPS event validation failed for bus {}: {}", 
                        gpsEvent.getBusId(), gpsEvent);
                // Acknowledge to avoid reprocessing invalid message
                acknowledgment.acknowledge();
                return;
            }
            
            // Convert busId string to UUID
            UUID busId;
            try {
                busId = UUID.fromString(gpsEvent.getBusId());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid bus ID format: {}", gpsEvent.getBusId());
                acknowledgment.acknowledge();
                return;
            }
            
            // Update bus position
            busService.updateBusPosition(
                    busId,
                    gpsEvent.getLatitude(),
                    gpsEvent.getLongitude(),
                    gpsEvent.getSpeed(),
                    gpsEvent.getTimestamp()
            );
            
            log.debug("GPS position updated for bus {} at [{}, {}]", 
                    gpsEvent.getBusId(), gpsEvent.getLatitude(), gpsEvent.getLongitude());
            
            // Manual commit of offset
            acknowledgment.acknowledge();
            
        } catch (Exception e) {
            log.error("Error processing GPS event for bus {}: {}", 
                    gpsEvent.getBusId(), e.getMessage(), e);
            // In case of error, still acknowledge to avoid infinite retries
            // In production, consider sending to DLT instead
            acknowledgment.acknowledge();
        }
    }
    
    /**
     * Validate incoming GPS event data.
     * Checks:
     * - Coordinates are within valid range
     * - Timestamp is not too old
     * - All required fields are present
     * 
     * @param gpsEvent GPS event to validate
     * @return true if valid, false otherwise
     */
    private boolean validateGpsEvent(GpsRawLocationEvent gpsEvent) {
        
        // Check required fields
        if (gpsEvent == null || 
            gpsEvent.getBusId() == null ||
            gpsEvent.getLatitude() == null || 
            gpsEvent.getLongitude() == null ||
            gpsEvent.getTimestamp() == null) {
            
            log.warn("GPS event missing required fields");
            return false;
        }
        
        // Validate latitude
        if (gpsEvent.getLatitude() < MIN_LATITUDE || gpsEvent.getLatitude() > MAX_LATITUDE) {
            log.warn("Invalid latitude: {}", gpsEvent.getLatitude());
            return false;
        }
        
        // Validate longitude
        if (gpsEvent.getLongitude() < MIN_LONGITUDE || gpsEvent.getLongitude() > MAX_LONGITUDE) {
            log.warn("Invalid longitude: {}", gpsEvent.getLongitude());
            return false;
        }
        
        // Validate timestamp is not too old
        LocalDateTime now = LocalDateTime.now();
        long minutesOld = ChronoUnit.MINUTES.between(gpsEvent.getTimestamp(), now);
        
        if (minutesOld > MAX_GPS_AGE_MINUTES) {
            log.warn("GPS timestamp too old: {} minutes", minutesOld);
            return false;
        }
        
        // Validate speed if present
        if (gpsEvent.getSpeed() != null && gpsEvent.getSpeed() < 0) {
            log.warn("Invalid speed value: {}", gpsEvent.getSpeed());
            return false;
        }
        
        return true;
    }
}
