package com.soa.busservice.service;

import com.soa.busservice.dto.CreateBusDto;
import com.soa.busservice.dto.BusDto;
import com.soa.busservice.dto.BusLocationDto;
import com.soa.busservice.dto.kafka.BusLocationUpdateEvent;
import com.soa.busservice.dto.kafka.BusStatusEvent;
import com.soa.busservice.model.Bus;
import com.soa.busservice.model.BusLocationHistory;
import com.soa.busservice.model.BusStatus;
import com.soa.busservice.model.Route;
import com.soa.busservice.repository.BusRepository;
import com.soa.busservice.repository.BusLocationHistoryRepository;
import com.soa.busservice.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Business logic service for Bus operations.
 * Handles CRUD operations, domain logic, and publishes Kafka events.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BusService {
    
    private final BusRepository busRepository;
    private final BusLocationHistoryRepository busLocationHistoryRepository;
    private final RouteRepository routeRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    // Kafka Topics
    private static final String TOPIC_BUS_STATUS_EVENTS = "bus.status.events";
    private static final String TOPIC_BUS_LOCATION_UPDATES = "bus.location.updates";
    private static final String TOPIC_BUS_LIFECYCLE_EVENTS = "bus.lifecycle.events";
    
    /**
     * Create a new bus.
     * @param createBusDto Data transfer object for bus creation
     * @return Created bus as DTO
     */
    public BusDto createBus(CreateBusDto createBusDto) {
        log.info("Creating new bus with matricule: {}", createBusDto.getMatricule());
        
        // Check for duplicate matricule
        if (busRepository.findByMatricule(createBusDto.getMatricule()).isPresent()) {
            log.warn("Bus with matricule {} already exists", createBusDto.getMatricule());
            throw new IllegalArgumentException("A bus with this matricule already exists");
        }
        
        Bus.BusBuilder busBuilder = Bus.builder()
                .matricule(createBusDto.getMatricule())
                .capacity(createBusDto.getCapacity())
                .status(createBusDto.getStatus());
        
        // Set route if provided
        if (createBusDto.getCurrentRouteId() != null) {
            Route route = routeRepository.findById(UUID.fromString(createBusDto.getCurrentRouteId()))
                    .orElse(null);
            busBuilder.currentRoute(route);
        }
        
        Bus savedBus = busRepository.save(busBuilder.build());
        String routeInfo = savedBus.getCurrentRoute() != null ? savedBus.getCurrentRoute().getLineNumber() : "none";
        log.info("Bus created successfully with ID: {} on route: {}", savedBus.getBusId(), routeInfo);

        // Publish bus created event for synchronization
        publishBusLifecycleEvent("CREATED", savedBus);

        return mapToDto(savedBus);
    }
    
    /**
     * Retrieve all buses.
     * @return List of all buses as DTOs
     */
    @Transactional(readOnly = true)
    public List<BusDto> getAllBuses() {
        log.debug("Fetching all buses");
        return busRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Retrieve all bus entities (for internal service use).
     * @return List of all bus entities
     */
    @Transactional(readOnly = true)
    public List<Bus> getAllBusEntities() {
        return busRepository.findAll();
    }
    
    /**
     * Retrieve all active buses (EN_SERVICE status).
     * @return List of active buses as DTOs
     */
    @Transactional(readOnly = true)
    public List<BusDto> getAllActiveBuses() {
        log.debug("Fetching all active buses");
        return busRepository.findAllActiveBuses().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Retrieve buses by status filter.
     * @param status Bus operational status
     * @return List of buses with the specified status
     */
    @Transactional(readOnly = true)
    public List<BusDto> getBusesByStatus(BusStatus status) {
        log.debug("Fetching buses with status: {}", status);
        return busRepository.findByStatus(status).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Retrieve buses assigned to a specific route.
     * @param routeId Route identifier
     * @return List of buses assigned to the route
     */
    @Transactional(readOnly = true)
    public List<BusDto> getBusesByRoute(String routeId) {
        log.debug("Fetching buses for route: {}", routeId);
        UUID routeUuid = UUID.fromString(routeId);
        return busRepository.findByCurrentRouteRouteId(routeUuid).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Retrieve a specific bus by ID.
     * @param busId Bus identifier
     * @return Bus as DTO
     * @throws NoSuchElementException if bus not found
     */
    @Transactional(readOnly = true)
    public BusDto getBusById(UUID busId) {
        log.debug("Fetching bus with ID: {}", busId);
        return busRepository.findById(busId)
                .map(this::mapToDto)
                .orElseThrow(() -> {
                    log.warn("Bus not found with ID: {}", busId);
                    return new NoSuchElementException("Bus not found with ID: " + busId);
                });
    }
    
    /**
     * Update bus information.
     * @param busId Bus identifier
     * @param createBusDto Updated bus data
     * @return Updated bus as DTO
     */
    public BusDto updateBus(UUID busId, CreateBusDto createBusDto) {
        log.info("Updating bus with ID: {}", busId);
        
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> {
                    log.warn("Bus not found with ID: {}", busId);
                    return new NoSuchElementException("Bus not found with ID: " + busId);
                });
        
        // Verify matricule uniqueness if changed
        if (!bus.getMatricule().equals(createBusDto.getMatricule())
                && busRepository.findByMatricule(createBusDto.getMatricule()).isPresent()) {
            log.warn("Bus with matricule {} already exists", createBusDto.getMatricule());
            throw new IllegalArgumentException("A bus with this matricule already exists");
        }
        
        BusStatus oldStatus = bus.getStatus();
        bus.setMatricule(createBusDto.getMatricule());
        bus.setCapacity(createBusDto.getCapacity());
        bus.setStatus(createBusDto.getStatus());
        
        // Update route if provided
        if (createBusDto.getCurrentRouteId() != null) {
            Route route = routeRepository.findById(UUID.fromString(createBusDto.getCurrentRouteId()))
                    .orElse(null);
            bus.setCurrentRoute(route);
        }
        
        Bus updatedBus = busRepository.save(bus);
        log.info("Bus updated successfully with ID: {}", busId);

        // Publish status change event if status changed
        if (!oldStatus.equals(createBusDto.getStatus())) {
            publishBusStatusEvent(busId.toString(), oldStatus.toString(), createBusDto.getStatus().toString());
        }

        // Publish bus updated event for synchronization
        publishBusLifecycleEvent("UPDATED", updatedBus);

        return mapToDto(updatedBus);
    }
    
    /**
     * Assign a bus to a route.
     * @param busId Bus identifier
     * @param routeId Route identifier
     * @return Updated bus as DTO
     */
    public BusDto assignRoute(UUID busId, String routeId) {
        log.info("Assigning bus {} to route {}", busId, routeId);
        
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> {
                    log.warn("Bus not found with ID: {}", busId);
                    return new NoSuchElementException("Bus not found with ID: " + busId);
                });
        
        Route route = routeRepository.findById(UUID.fromString(routeId))
                .orElseThrow(() -> new NoSuchElementException("Route not found with ID: " + routeId));
        
        bus.setCurrentRoute(route);
        Bus updatedBus = busRepository.save(bus);
        log.info("Bus {} assigned to route {}", busId, route.getLineNumber());
        
        return mapToDto(updatedBus);
    }
    
    /**
     * Delete a bus from the fleet.
     * @param busId Bus identifier
     */
    public void deleteBus(UUID busId) {
        log.info("Deleting bus with ID: {}", busId);

        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> {
                    log.warn("Bus not found with ID: {}", busId);
                    return new NoSuchElementException("Bus not found with ID: " + busId);
                });

        // Publish bus deleted event before deletion
        publishBusLifecycleEvent("DELETED", bus);

        busRepository.deleteById(busId);
        log.info("Bus deleted successfully with ID: {}", busId);
    }
    
    /**
     * Get the last known location of a bus.
     * @param busId Bus identifier
     * @return Bus location DTO with latest position
     */
    @Transactional(readOnly = true)
    public BusLocationDto getLastLocation(UUID busId) {
        log.debug("Fetching last location for bus: {}", busId);
        
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new NoSuchElementException("Bus not found with ID: " + busId));
        
        return BusLocationDto.builder()
                .busId(bus.getBusId())
                .matricule(bus.getMatricule())
                .latitude(bus.getLastLatitude())
                .longitude(bus.getLastLongitude())
                .speed(null) // Speed not stored in Bus entity
                .timestamp(bus.getLastPositionTime())
                .build();
    }
    
    /**
     * Get all active bus locations.
     * @return List of locations for all active buses
     */
    @Transactional(readOnly = true)
    public List<BusLocationDto> getAllActiveBusLocations() {
        log.debug("Fetching all active bus locations");
        return busRepository.findAllActiveBuses().stream()
                .map(bus -> BusLocationDto.builder()
                        .busId(bus.getBusId())
                        .matricule(bus.getMatricule())
                        .latitude(bus.getLastLatitude())
                        .longitude(bus.getLastLongitude())
                        .timestamp(bus.getLastPositionTime())
                        .build())
                .collect(Collectors.toList());
    }
    
    /**
     * Update bus position with GPS data and persist to history.
     * Publishes location update event to Kafka.
     * 
     * @param busId Bus identifier
     * @param latitude GPS latitude coordinate
     * @param longitude GPS longitude coordinate
     * @param speed Current speed in km/h
     * @param timestamp GPS timestamp
     */
    public void updateBusPosition(UUID busId, Double latitude, Double longitude, Double speed, LocalDateTime timestamp) {
        log.debug("Updating position for bus {} at [{}, {}]", busId, latitude, longitude);
        
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new NoSuchElementException("Bus not found with ID: " + busId));
        
        // Update last known position
        bus.setLastLatitude(latitude);
        bus.setLastLongitude(longitude);
        bus.setLastPositionTime(timestamp);
        busRepository.save(bus);
        
        // Persist to history
        BusLocationHistory history = BusLocationHistory.builder()
                .busId(busId)
                .timestamp(timestamp)
                .latitude(latitude)
                .longitude(longitude)
                .speed(speed)
                .build();
        busLocationHistoryRepository.save(history);
        
        // Publish location update event
        String routeId = bus.getCurrentRoute() != null ? bus.getCurrentRoute().getRouteId().toString() : null;
        publishLocationUpdateEvent(busId.toString(), routeId, latitude, longitude, timestamp);
        
        log.debug("Bus position updated and persisted for bus {}", busId);
    }
    
    /**
     * Get location history for a bus within a time period.
     * @param busId Bus identifier
     * @param startTime Start of time period
     * @param endTime End of time period
     * @return List of location history records
     */
    @Transactional(readOnly = true)
    public List<BusLocationHistory> getLocationHistory(UUID busId, LocalDateTime startTime, LocalDateTime endTime) {
        log.debug("Fetching location history for bus {} from {} to {}", busId, startTime, endTime);
        return busLocationHistoryRepository.findBusLocationHistory(busId, startTime, endTime);
    }
    
    // ===== Private Helper Methods =====
    
    /**
     * Publish bus status change event to Kafka.
     */
    private void publishBusStatusEvent(String busId, String oldStatus, String newStatus) {
        BusStatusEvent event = BusStatusEvent.builder()
                .busId(busId)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .timestamp(LocalDateTime.now())
                .build();
        
        kafkaTemplate.send(TOPIC_BUS_STATUS_EVENTS, busId, event);
        log.info("Published status event for bus {}: {} -> {}", busId, oldStatus, newStatus);
    }
    
    /**
     * Publish bus location update event to Kafka.
     */
    private void publishLocationUpdateEvent(String busId, String routeId, Double latitude, Double longitude, LocalDateTime timestamp) {
        BusLocationUpdateEvent event = BusLocationUpdateEvent.builder()
                .busId(busId)
                .routeId(routeId)
                .latitude(latitude)
                .longitude(longitude)
                .timestamp(timestamp)
                .build();

        kafkaTemplate.send(TOPIC_BUS_LOCATION_UPDATES, busId, event);
        log.debug("Published location update event for bus {}", busId);
    }

    /**
     * Publish bus lifecycle event (create/update/delete) to Kafka for service synchronization.
     */
    private void publishBusLifecycleEvent(String eventType, Bus bus) {
        try {
            String routeId = bus.getCurrentRoute() != null ? bus.getCurrentRoute().getRouteId().toString() : null;
            var event = java.util.Map.of(
                    "eventType", eventType,
                    "busId", bus.getBusId().toString(),
                    "registrationNumber", bus.getMatricule(),
                    "capacity", bus.getCapacity(),
                    "status", bus.getStatus().toString(),
                    "routeId", routeId != null ? routeId : "",
                    "timestamp", LocalDateTime.now().toString()
            );

            kafkaTemplate.send(TOPIC_BUS_LIFECYCLE_EVENTS, bus.getBusId().toString(), event);
            log.info("Published {} event for bus {}", eventType, bus.getBusId());
        } catch (Exception e) {
            log.error("Failed to publish lifecycle event for bus {}: {}", bus.getBusId(), e.getMessage());
        }
    }
    
    /**
     * Convert Bus entity to BusDto.
     */
    private BusDto mapToDto(Bus bus) {
        String routeId = bus.getCurrentRoute() != null ? bus.getCurrentRoute().getRouteId().toString() : null;
        return BusDto.builder()
                .busId(bus.getBusId())
                .matricule(bus.getMatricule())
                .capacity(bus.getCapacity())
                .status(bus.getStatus())
                .currentRouteId(routeId)
                .lastLatitude(bus.getLastLatitude())
                .lastLongitude(bus.getLastLongitude())
                .lastPositionTime(bus.getLastPositionTime())
                .createdAt(bus.getCreatedAt())
                .updatedAt(bus.getUpdatedAt())
                .build();
    }
}
