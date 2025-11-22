package com.soa.busservice.kafka;

import com.soa.busservice.event.BusLocationEvent;
import com.soa.busservice.event.BusStatusEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String LOCATION_TOPIC = "bus.location.updates";
    private static final String STATUS_TOPIC = "bus.status.changes";

    public void publishLocationUpdate(BusLocationEvent event) {
        try {
            kafkaTemplate.send(LOCATION_TOPIC, event.getBusId(), event);
            log.info("Published location update for bus: {} to topic: {}", event.getBusNumber(), LOCATION_TOPIC);
        } catch (Exception e) {
            log.error("Failed to publish location update for bus: {}", event.getBusNumber(), e);
        }
    }

    public void publishStatusChange(BusStatusEvent event) {
        try {
            kafkaTemplate.send(STATUS_TOPIC, event.getBusId(), event);
            log.info("Published status change for bus: {} from {} to {} on topic: {}", 
                    event.getBusNumber(), event.getOldStatus(), event.getNewStatus(), STATUS_TOPIC);
        } catch (Exception e) {
            log.error("Failed to publish status change for bus: {}", event.getBusNumber(), e);
        }
    }
}
