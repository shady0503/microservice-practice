package com.soa.busservice.service;

import com.soa.busservice.dto.BusRequest;
import com.soa.busservice.dto.BusResponse;
import com.soa.busservice.dto.LocationUpdateRequest;
import com.soa.busservice.event.BusLineChangeEvent;
import com.soa.busservice.event.BusLocationEvent;
import com.soa.busservice.event.BusStatusEvent;
import com.soa.busservice.kafka.KafkaProducerService;
import com.soa.busservice.model.Bus;
import com.soa.busservice.model.Status;
import com.soa.busservice.repository.BusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusService {

    private final BusRepository busRepository;
    private final KafkaProducerService kafkaProducerService;

    @Transactional
    public BusResponse createBus(BusRequest request) {
        log.info("Creating new bus with number: {}", request.getBusNumber());
        
        if (busRepository.existsByBusNumber(request.getBusNumber())) {
            throw new IllegalArgumentException("Bus with number " + request.getBusNumber() + " already exists");
        }

        Bus bus = new Bus();
        bus.setBusNumber(request.getBusNumber());
        bus.setLineCode(request.getLineCode());
        bus.setCapacity(request.getCapacity());
        bus.setStatus(request.getStatus() != null ? request.getStatus() : Status.INACTIVE);
        bus.setLatitude(request.getLatitude());
        bus.setLongitude(request.getLongitude());
        bus.setSpeed(request.getSpeed());
        bus.setHeading(request.getHeading());

        if (request.getLatitude() != null && request.getLongitude() != null) {
            bus.setLastLocationUpdate(LocalDateTime.now());
        }

        Bus savedBus = busRepository.save(bus);
        log.info("Bus created successfully with ID: {}", savedBus.getId());
        
        return mapToResponse(savedBus);
    }

    @Transactional(readOnly = true)
    public List<BusResponse> getAllBuses() {
        log.info("Fetching all buses");
        return busRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BusResponse getBusById(UUID id) {
        log.info("Fetching bus with ID: {}", id);
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bus not found with ID: " + id));
        return mapToResponse(bus);
    }

    @Transactional(readOnly = true)
    public BusResponse getBusByNumber(String busNumber) {
        log.info("Fetching bus with number: {}", busNumber);
        Bus bus = busRepository.findByBusNumber(busNumber)
                .orElseThrow(() -> new IllegalArgumentException("Bus not found with number: " + busNumber));
        return mapToResponse(bus);
    }

    @Transactional(readOnly = true)
    public List<BusResponse> getBusesByStatus(Status status) {
        log.info("Fetching buses with status: {}", status);
        return busRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BusResponse> getBusesByLineCode(String lineCode) {
        log.info("Fetching buses for line: {}", lineCode);
        return busRepository.findByLineCode(lineCode).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BusResponse updateBus(UUID id, BusRequest request) {
        log.info("Updating bus with ID: {}", id);
        
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bus not found with ID: " + id));

        // Check if bus number is being changed and if it already exists
        if (!bus.getBusNumber().equals(request.getBusNumber()) && 
            busRepository.existsByBusNumber(request.getBusNumber())) {
            throw new IllegalArgumentException("Bus with number " + request.getBusNumber() + " already exists");
        }

        Status oldStatus = bus.getStatus();
        
        bus.setBusNumber(request.getBusNumber());
        bus.setLineCode(request.getLineCode());
        bus.setCapacity(request.getCapacity());
        
        if (request.getStatus() != null && !request.getStatus().equals(oldStatus)) {
            bus.setStatus(request.getStatus());
        }
        
        if (request.getLatitude() != null && request.getLongitude() != null) {
            bus.setLatitude(request.getLatitude());
            bus.setLongitude(request.getLongitude());
            bus.setSpeed(request.getSpeed());
            bus.setHeading(request.getHeading());
            bus.setLastLocationUpdate(LocalDateTime.now());
        }

        Bus updatedBus = busRepository.save(bus);
        log.info("Bus updated successfully with ID: {}", updatedBus.getId());
        
        // Publish status change event if status changed
        if (request.getStatus() != null && !request.getStatus().equals(oldStatus)) {
            BusStatusEvent statusEvent = new BusStatusEvent(
                updatedBus.getId().toString(),
                updatedBus.getBusNumber(),
                updatedBus.getLineCode(),
                oldStatus,
                updatedBus.getStatus(),
                LocalDateTime.now()
            );
            kafkaProducerService.publishStatusChange(statusEvent);
        }
        
        return mapToResponse(updatedBus);
    }

    @Transactional
    public BusResponse updateBusLocation(UUID id, LocationUpdateRequest request) {
        log.info("Updating location for bus ID: {}", id);
        
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bus not found with ID: " + id));

        bus.setLatitude(request.getLatitude());
        bus.setLongitude(request.getLongitude());
        bus.setSpeed(request.getSpeed());
        bus.setHeading(request.getHeading());
        bus.setLastLocationUpdate(LocalDateTime.now());

        Bus updatedBus = busRepository.save(bus);
        log.info("Bus location updated successfully for ID: {}", updatedBus.getId());
        
        // Publish location update event
        BusLocationEvent locationEvent = new BusLocationEvent(
            updatedBus.getId().toString(),
            updatedBus.getBusNumber(),
            updatedBus.getLineCode(),
            updatedBus.getLatitude(),
            updatedBus.getLongitude(),
            updatedBus.getSpeed(),
            updatedBus.getHeading(),
            LocalDateTime.now()
        );
        kafkaProducerService.publishLocationUpdate(locationEvent);
        
        return mapToResponse(updatedBus);
    }

    @Transactional
    public void deleteBus(UUID id) {
        log.info("Deleting bus with ID: {}", id);
        
        if (!busRepository.existsById(id)) {
            throw new IllegalArgumentException("Bus not found with ID: " + id);
        }

        busRepository.deleteById(id);
        log.info("Bus deleted successfully with ID: {}", id);
    }

    @Transactional
    public void updateBusLine(UUID id, String newLineCode) {
        log.info("Updating line for bus ID: {}", id);
        
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bus not found with ID: " + id));

        // Publish event if the lineCode changes
        if (!bus.getLineCode().equals(newLineCode)) {
            BusLineChangeEvent event = new BusLineChangeEvent(
                bus.getId().toString(),
                bus.getLineCode(),
                newLineCode
            );
            kafkaProducerService.publishLineChangeEvent(event);

            // Update the bus entity
            bus.setLineCode(newLineCode);
            busRepository.save(bus);
        }
    }

    @Transactional
    public void saveBusWithRetry(Bus bus) {
        int retries = 3;
        while (retries > 0) {
            try {
                if (bus.getId() != null && busRepository.existsById(bus.getId())) {
                    Bus existingBus = busRepository.findById(bus.getId()).orElseThrow();
                    existingBus.updateFrom(bus); // Copy fields from the new bus to the existing one
                    busRepository.save(existingBus);
                } else {
                    busRepository.save(bus);
                }
                break;
            } catch (OptimisticLockingFailureException e) {
                retries--;
                log.warn("Retrying save for bus: {}", bus.getBusNumber());
                if (retries == 0) {
                    log.error("Failed to save bus after retries: {}", bus.getBusNumber(), e);
                    throw e;
                }
            }
        }
    }

    private BusResponse mapToResponse(Bus bus) {
        BusResponse response = new BusResponse();
        response.setId(bus.getId());
        response.setBusNumber(bus.getBusNumber());
        response.setLineCode(bus.getLineCode());
        response.setCapacity(bus.getCapacity());
        response.setStatus(bus.getStatus());
        response.setLatitude(bus.getLatitude());
        response.setLongitude(bus.getLongitude());
        response.setSpeed(bus.getSpeed());
        response.setHeading(bus.getHeading());
        response.setLastLocationUpdate(bus.getLastLocationUpdate());
        response.setCreatedAt(bus.getCreatedAt());
        response.setUpdatedAt(bus.getUpdatedAt());
        return response;
    }
}
