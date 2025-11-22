package com.soa.busservice.util;

import com.soa.busservice.model.Bus;
import com.soa.busservice.model.Status;
import com.soa.busservice.service.BusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Component
public class BusSimulationScript {

    @Autowired
    private BusService busService;

    public void createRandomBuses() {
        String[] busLines = {"LineA", "LineB", "LineC"}; // Example bus lines
        Random random = new Random();

        for (String line : busLines) {
            int numberOfBuses = random.nextInt(4) + 2; // Create 2 to 5 buses per line
            List<Bus> buses = new ArrayList<>();

            for (int i = 0; i < numberOfBuses; i++) {
                Bus bus = new Bus();
                bus.setId(UUID.randomUUID());
                bus.setBusNumber("Bus-" + UUID.randomUUID().toString().substring(0, 8));
                bus.setLineCode(line);
                bus.setCapacity(random.nextInt(50) + 20); // Capacity between 20 and 70
                bus.setStatus(Status.ACTIVE);

                // Randomize initial geolocation
                bus.setLatitude(40.0 + random.nextDouble());
                bus.setLongitude(-74.0 + random.nextDouble());
                bus.setSpeed(random.nextDouble() * 50); // Speed between 0 and 50 km/h
                bus.setHeading(random.nextDouble() * 360); // Heading in degrees

                buses.add(bus);
            }

            // Save buses to the database
            buses.forEach(busService::saveBusWithRetry);

            System.out.println("Created " + numberOfBuses + " buses for line " + line);
        }
    }
}