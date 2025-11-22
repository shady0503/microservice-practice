package com.trajets.kafka;

import com.trajets.event.LineChangeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String LINE_CHANGE_TOPIC = "line.changes";

    public void publishLineChange(LineChangeEvent event) {
        try {
            kafkaTemplate.send(LINE_CHANGE_TOPIC, event.getLineCode(), event);
            log.info("Published line change event: {} for line: {} to topic: {}", 
                    event.getChangeType(), event.getLineCode(), LINE_CHANGE_TOPIC);
        } catch (Exception e) {
            log.error("Failed to publish line change event for line: {}", event.getLineCode(), e);
        }
    }
}
