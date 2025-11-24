package com.trajets.kafka;

import com.trajets.event.BusLineChangeEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    @KafkaListener(topics = "bus.line.change", groupId = "trajet-service")
    public void handleBusLineChange(BusLineChangeEvent event) {
        // Update the route based on the new lineCode (pseudo-code)
        System.out.println("Received event: " + event);
        updateRouteForBus(event.getBusId(), event.getNewLineCode());
    }

    private void updateRouteForBus(String busId, String newLineCode) {
        // Logic to update the route for the bus
        System.out.println("Updating route for bus " + busId + " to line " + newLineCode);
    }
}