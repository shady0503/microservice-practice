package com.example.UserService.kafka;

import com.example.UserService.event.UserEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String TOPIC = "user.events";

    public void publishUserEvent(UserEvent event) {
        try {
            kafkaTemplate.send(TOPIC, event.getUserId().toString(), event);
            log.info("Published user event: {} for user {}", event.getAction(), event.getEmail());
        } catch (Exception e) {
            log.error("Error publishing user event", e);
        }
    }
}