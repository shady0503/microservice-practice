// src/main/java/com/trajets/service/LineService.java
package com.trajets.service;

import com.trajets.dto.CsvRouteRecord;
import com.trajets.dto.OsmRouteData;
import com.trajets.kafka.RouteCreatedEvent;
import com.trajets.kafka.RouteEventProducer;
import com.trajets.model.*;
import com.trajets.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LineService {
    
    private final LineRepository lineRepository;
    private final RouteRepository routeRepository;
    private final StopRepository stopRepository;
    private final RouteStopRepository routeStopRepository;
    private final OsmImportService osmImportService;
    private final RouteEventProducer routeEventProducer;
    
    /**
     * Import a line by trying multiple route records until finding valid data
     * Returns true only if successfully imported with valid geometry and stops
     */
    @Transactional
    public boolean importLine(String ref, List<CsvRouteRecord> routeRecords) {
        log.info("Attempting to import line: {} ({} route options)", ref, routeRecords.size());
        
        OsmRouteData validRouteData = null;
        CsvRouteRecord usedRecord = null;
        
        // Try each route record until we find one with valid data
        for (CsvRouteRecord record : routeRecords) {
            log.info("  Trying OSM relation: {} - {}", record.getOsmRelationId(), record.getName());
            
            try {
                Optional<OsmRouteData> osmDataOpt = osmImportService.fetchRouteData(
                        record.getOsmRelationId());
                
                if (osmDataOpt.isEmpty()) {
                    log.warn("  ✗ Relation {} does not exist or failed to fetch", 
                            record.getOsmRelationId());
                    continue;
                }
                
                OsmRouteData osmData = osmDataOpt.get();
                
                // Validate the data
                ValidationResult validation = validateRouteData(osmData);
                if (!validation.isValid()) {
                    log.warn("  ✗ Relation {} is invalid: {}", 
                            record.getOsmRelationId(), validation.getReason());
                    continue;
                }
                
                // Found valid data!
                validRouteData = osmData;
                usedRecord = record;
                log.info("  ✓ Found valid data in relation: {}", record.getOsmRelationId());
                break;
                
            } catch (Exception e) {
                log.error("  ✗ Error processing relation {}: {}", 
                        record.getOsmRelationId(), e.getMessage());
            }
        }
        
        // If no valid route found, skip this line
        if (validRouteData == null || usedRecord == null) {
            log.error("✗ No valid route data found for line: {} (tried {} options)", 
                    ref, routeRecords.size());
            return false;
        }
        
        // Import the valid route
        try {
            return saveLineAndRoute(ref, usedRecord, validRouteData);
        } catch (Exception e) {
            log.error("✗ Failed to save line {}: {}", ref, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Validate that route data is usable
     */
    private ValidationResult validateRouteData(OsmRouteData osmData) {
        // Check geometry exists and is not empty
        if (osmData.getGeometryGeoJson() == null || osmData.getGeometryGeoJson().trim().isEmpty()) {
            return ValidationResult.invalid("Geometry is empty");
        }
        
        // Check geometry is valid JSON
        try {
            if (!osmData.getGeometryGeoJson().contains("coordinates")) {
                return ValidationResult.invalid("Geometry missing coordinates");
            }
        } catch (Exception e) {
            return ValidationResult.invalid("Geometry is not valid JSON");
        }
        
        // Check has at least some stops
        if (osmData.getStops() == null || osmData.getStops().isEmpty()) {
            return ValidationResult.invalid("No stops found");
        }
        
        // Check stops have valid coordinates
        long validStops = osmData.getStops().stream()
                .filter(s -> s.getLatitude() != null && s.getLongitude() != null)
                .count();
        
        if (validStops == 0) {
            return ValidationResult.invalid("No stops with valid coordinates");
        }
        
        if (validStops < osmData.getStops().size()) {
            log.warn("  ⚠ Some stops missing coordinates ({}/{})", 
                    validStops, osmData.getStops().size());
        }
        
        return ValidationResult.valid();
    }
    
    /**
     * Save the line and route to database
     */
    private boolean saveLineAndRoute(String ref, CsvRouteRecord csvRecord, OsmRouteData osmData) {
        // Create or update Line
        Line line = lineRepository.findByRef(ref)
                .orElseGet(() -> {
                    Line newLine = new Line();
                    newLine.setRef(ref);
                    return newLine;
                });
        
        line.setName(extractLineName(csvRecord.getName()));
        line.setOsmRelationId(csvRecord.getOsmRelationId());
        line.setUpdatedAt(LocalDateTime.now());
        line = lineRepository.save(line);
        
        log.info("  Line saved: {} (ID: {})", line.getRef(), line.getId());
        
        // Delete any existing routes for this line (for re-import)
        routeRepository.deleteByLineId(line.getId());
        
        // Create the Route
        Route route = new Route();
        route.setLine(line);
        route.setName(csvRecord.getName());
        route.setGeometry(osmData.getGeometryGeoJson());
        route.setDirection(determineDirection(csvRecord.getName()));
        
        route = routeRepository.save(route);
        log.info("  Route saved: {} ({}) - ID: {}", 
                route.getName(), route.getDirection(), route.getId());
        
        // Publish RouteCreatedEvent
        RouteCreatedEvent event = new RouteCreatedEvent(route.getId(), route.getName(), route.getDirection(), route.getGeometry());
        routeEventProducer.publish(event);
        log.info("  RouteCreatedEvent published for route ID: {}", route.getId());

        // Save stops
        int savedStops = 0;
        for (var stopData : osmData.getStops()) {
            // Skip stops without coordinates
            if (stopData.getLatitude() == null || stopData.getLongitude() == null) {
                log.warn("    Skipping stop without coordinates: {}", stopData.getName());
                continue;
            }
            
            Stop stop = findOrCreateStop(stopData);
            
            RouteStop routeStop = new RouteStop();
            routeStop.setRoute(route);
            routeStop.setStop(stop);
            routeStop.setStopOrder(stopData.getOrder());
            
            routeStopRepository.save(routeStop);
            savedStops++;
        }
        
        log.info("  Stops saved: {} (total in OSM: {})", savedStops, osmData.getStops().size());
        log.info("✓ Successfully imported line: {}", ref);
        
        return true;
    }
    
    /**
     * Extract line name without direction
     */
    private String extractLineName(String fullName) {
        if (fullName.contains(":")) {
            return fullName.split(":")[0].trim();
        }
        return fullName;
    }
    
    /**
     * Determine direction from route name
     */
    private String determineDirection(String routeName) {
        String lower = routeName.toLowerCase();
        
        if (lower.contains("retour") || lower.contains("return") || lower.contains("←")) {
            return "RETURN";
        }
        
        if (lower.contains("circular") || lower.contains("circulaire")) {
            return "CIRCULAR";
        }
        
        return "GOING";
    }
    
    /**
     * Find or create stop
     */
    private Stop findOrCreateStop(com.trajets.dto.OsmStopData stopData) {
        // Try by OSM node ID
        if (stopData.getNodeId() != null) {
            Optional<Stop> existing = stopRepository.findByOsmNodeId(stopData.getNodeId());
            if (existing.isPresent()) {
                return existing.get();
            }
        }
        
        // Try by coordinates (within ~10m)
        Optional<Stop> existing = stopRepository.findFirstByLatitudeAndLongitude(
                stopData.getLatitude(), stopData.getLongitude());
        
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // Create new
        Stop stop = new Stop();
        stop.setName(stopData.getName());
        stop.setLatitude(stopData.getLatitude());
        stop.setLongitude(stopData.getLongitude());
        stop.setOsmNodeId(stopData.getNodeId());
        
        return stopRepository.save(stop);
    }
    
    public List<Line> getAllLines() {
        return lineRepository.findAll();
    }
    
    public Optional<Line> getLineByRef(String ref) {
        return lineRepository.findByRef(ref);
    }
    
    /**
     * Validation result helper class
     */
    private static class ValidationResult {
        private final boolean valid;
        private final String reason;
        
        private ValidationResult(boolean valid, String reason) {
            this.valid = valid;
            this.reason = reason;
        }
        
        static ValidationResult valid() {
            return new ValidationResult(true, null);
        }
        
        static ValidationResult invalid(String reason) {
            return new ValidationResult(false, reason);
        }
        
        boolean isValid() {
            return valid;
        }
        
        String getReason() {
            return reason;
        }
    }
}