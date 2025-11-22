package com.trajets.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RouteEventProducer {

    private static final String TOPIC = "route-created";
    private final KafkaTemplate<String, RouteCreatedEvent> kafkaTemplate;

    public void publish(RouteCreatedEvent event) {
        kafkaTemplate.send(TOPIC, event);
        log.info("Published RouteCreatedEvent: {}", event);
    }
}