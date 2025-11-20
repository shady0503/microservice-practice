package com.soa.busservice.controller;

import com.soa.busservice.dto.CreateBusDto;
import com.soa.busservice.dto.BusDto;
import com.soa.busservice.dto.BusLocationDto;
import com.soa.busservice.model.BusStatus;
import com.soa.busservice.service.BusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Bus management endpoints.
 * Exposes CRUD operations and location queries for the Bus Service.
 */
@RestController
@RequestMapping("/buses")
@RequiredArgsConstructor
@Slf4j
public class BusController {
    
    private final BusService busService;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    
    /**
     * Create a new bus.
     * POST /buses
     * 
     * @param createBusDto Bus creation data
     * @return Created bus
     */
    @PostMapping
    public ResponseEntity<BusDto> createBus(@Valid @RequestBody CreateBusDto createBusDto) {
        log.info("POST /buses - Creating new bus with matricule: {}", createBusDto.getMatricule());
        BusDto createdBus = busService.createBus(createBusDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdBus);
    }
    
    /**
     * Retrieve all buses.
     * GET /buses
     * Optional query params:
     *  - status: Filter by bus status (EN_SERVICE, HORS_SERVICE, EN_MAINTENANCE)
     *  - routeId: Filter by assigned route
     *  - active: Get only active buses (status=EN_SERVICE)
     * 
     * @param status Optional status filter
     * @param routeId Optional route filter
     * @param active Optional flag to get only active buses
     * @return List of buses
     */
    @GetMapping
    public ResponseEntity<List<BusDto>> getAllBuses(
            @RequestParam(required = false) BusStatus status,
            @RequestParam(required = false) String routeId,
            @RequestParam(required = false, defaultValue = "false") boolean active) {
        
        log.info("GET /buses - Fetching buses (status={}, routeId={}, active={})", status, routeId, active);
        
        List<BusDto> buses;
        if (active) {
            buses = busService.getAllActiveBuses();
        } else if (status != null) {
            buses = busService.getBusesByStatus(status);
        } else if (routeId != null) {
            buses = busService.getBusesByRoute(routeId);
        } else {
            buses = busService.getAllBuses();
        }
        
        return ResponseEntity.ok(buses);
    }
    
    /**
     * Retrieve a specific bus by ID.
     * GET /buses/{busId}
     * 
     * @param busId Bus identifier
     * @return Bus details
     */
    @GetMapping("/{busId}")
    public ResponseEntity<BusDto> getBusById(@PathVariable UUID busId) {
        log.info("GET /buses/{} - Fetching bus", busId);
        BusDto bus = busService.getBusById(busId);
        return ResponseEntity.ok(bus);
    }
    
    /**
     * Update bus information.
     * PUT /buses/{busId}
     * 
     * @param busId Bus identifier
     * @param createBusDto Updated bus data
     * @return Updated bus
     */
    @PutMapping("/{busId}")
    public ResponseEntity<BusDto> updateBus(
            @PathVariable UUID busId,
            @Valid @RequestBody CreateBusDto createBusDto) {
        
        log.info("PUT /buses/{} - Updating bus", busId);
        BusDto updatedBus = busService.updateBus(busId, createBusDto);
        return ResponseEntity.ok(updatedBus);
    }
    
    /**
     * Assign a bus to a route.
     * POST /buses/{busId}/assign-route/{routeId}
     * 
     * @param busId Bus identifier
     * @param routeId Route identifier
     * @return Updated bus
     */
    @PostMapping("/{busId}/assign-route/{routeId}")
    public ResponseEntity<BusDto> assignRoute(
            @PathVariable UUID busId,
            @PathVariable String routeId) {
        
        log.info("POST /buses/{}/assign-route/{} - Assigning bus to route", busId, routeId);
        BusDto updatedBus = busService.assignRoute(busId, routeId);
        return ResponseEntity.ok(updatedBus);
    }
    
    /**
     * Delete a bus.
     * DELETE /buses/{busId}
     * 
     * @param busId Bus identifier
     * @return No content response
     */
    @DeleteMapping("/{busId}")
    public ResponseEntity<Void> deleteBus(@PathVariable UUID busId) {
        log.info("DELETE /buses/{} - Deleting bus", busId);
        busService.deleteBus(busId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get the last known position of a bus.
     * GET /buses/{busId}/location
     * 
     * @param busId Bus identifier
     * @return Last known location
     */
    @GetMapping("/{busId}/location")
    public ResponseEntity<BusLocationDto> getLastLocation(@PathVariable UUID busId) {
        log.info("GET /buses/{}/location - Fetching last location", busId);
        BusLocationDto location = busService.getLastLocation(busId);
        return ResponseEntity.ok(location);
    }
    
    /**
     * Get locations for all active buses.
     * GET /buses/locations
     * 
     * @return List of active bus locations
     */
    @GetMapping("/locations")
    public ResponseEntity<List<BusLocationDto>> getAllActiveBusLocations() {
        log.info("GET /buses/locations - Fetching all active bus locations");
        List<BusLocationDto> locations = busService.getAllActiveBusLocations();
        return ResponseEntity.ok(locations);
    }
    
    /**
     * Get location history for a bus.
     * GET /buses/{busId}/locations/history?from=...&to=...
     * 
     * Date format: ISO_LOCAL_DATE_TIME (e.g., 2025-11-15T10:30:00)
     * 
     * @param busId Bus identifier
     * @param from Start timestamp (ISO format)
     * @param to End timestamp (ISO format)
     * @return List of location history records
     */
    @GetMapping("/{busId}/locations/history")
    public ResponseEntity<Object> getLocationHistory(
            @PathVariable UUID busId,
            @RequestParam String from,
            @RequestParam String to) {
        
        log.info("GET /buses/{}/locations/history - Fetching history from {} to {}", busId, from, to);
        
        try {
            LocalDateTime startTime = LocalDateTime.parse(from, DATE_FORMATTER);
            LocalDateTime endTime = LocalDateTime.parse(to, DATE_FORMATTER);
            
            var history = busService.getLocationHistory(busId, startTime, endTime);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error parsing date parameters", e);
            return ResponseEntity.badRequest()
                    .body("Invalid date format. Please use ISO_LOCAL_DATE_TIME format (e.g., 2025-11-15T10:30:00)");
        }
    }
}
