package com.soa.busservice.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class KafkaConsumerService {

    @KafkaListener(topics = "line.changes", groupId = "bus-service-group")
    public void consumeLineChange(Map<String, Object> message) {
        try {
            String changeType = (String) message.get("changeType");
            String lineCode = (String) message.get("lineCode");
            String lineName = (String) message.get("lineName");
            
            log.info("Received line change event: {} for line {} ({})", changeType, lineCode, lineName);
            
            switch (changeType) {
                case "DELETED":
                    log.warn("Line {} has been deleted. Buses on this line should be reassigned.", lineCode);
                    // TODO: Alert system or mark buses on this line for review
                    break;
                case "UPDATED":
                    log.info("Line {} has been updated. Bus assignments may need review.", lineCode);
                    // TODO: Check if lineCode changed and update buses accordingly
                    break;
                case "CREATED":
                    log.info("New line {} created and available for bus assignment.", lineCode);
                    break;
                default:
                    log.warn("Unknown change type: {}", changeType);
            }
            
        } catch (Exception e) {
            log.error("Error processing line change event", e);
        }
    }
}
