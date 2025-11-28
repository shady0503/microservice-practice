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
import java.util.ArrayList;
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
     * Import a line and ALL its associated routes (directions)
     * "If not return route, use one for both" logic is handled by processing all available records.
     */
    @Transactional
    public boolean importLine(String ref, List<CsvRouteRecord> routeRecords) {
        log.info("Importing line: {} ({} route options)", ref, routeRecords.size());
        
        // 1. Create or Update the Line Entity first (Once per line)
        Line line = lineRepository.findByRef(ref)
                .orElseGet(() -> {
                    Line newLine = new Line();
                    newLine.setRef(ref);
                    newLine.setName("Line " + ref);
                    return lineRepository.save(newLine);
                });

        // Update metadata from the first record (shared info)
        if (!routeRecords.isEmpty()) {
            line.setName(extractLineName(routeRecords.get(0).getName()));
            line.setUpdatedAt(LocalDateTime.now());
            line = lineRepository.save(line);
        }

        // 2. Clear existing routes for this line to ensure a clean, complete import
        routeRepository.deleteByLineId(line.getId());
        
        int importedRoutesCount = 0;
        
        // 3. Process ALL route records to capture both "Going" and "Return"
        for (CsvRouteRecord record : routeRecords) {
            log.info("  Processing route option: {} (OSM: {})", record.getName(), record.getOsmRelationId());
            
            try {
                Optional<OsmRouteData> osmDataOpt = osmImportService.fetchRouteData(record.getOsmRelationId());
                
                if (osmDataOpt.isEmpty()) {
                    log.warn("    ✗ Failed to fetch OSM relation {}", record.getOsmRelationId());
                    continue;
                }
                
                OsmRouteData osmData = osmDataOpt.get();
                
                // Validate
                ValidationResult validation = validateRouteData(osmData);
                if (!validation.isValid()) {
                    log.warn("    ✗ Invalid route data: {}", validation.getReason());
                    continue;
                }
                
                // Save this specific route direction
                saveRouteForLine(line, record, osmData);
                importedRoutesCount++;
                log.info("    ✓ Imported route: {}", record.getName());
                
            } catch (Exception e) {
                log.error("    ✗ Error processing route {}: {}", record.getName(), e.getMessage());
            }
        }
        
        if (importedRoutesCount > 0) {
            log.info("✓ Successfully imported line {} with {} routes", ref, importedRoutesCount);
            return true;
        } else {
            log.error("✗ Failed to import any valid routes for line {}", ref);
            return false;
        }
    }
    
    private void saveRouteForLine(Line line, CsvRouteRecord csvRecord, OsmRouteData osmData) {
        // Create the Route
        Route route = new Route();
        route.setLine(line);
        route.setName(csvRecord.getName());
        route.setGeometry(osmData.getGeometryGeoJson());
        route.setDirection(determineDirection(csvRecord.getName()));
        
        route = routeRepository.save(route);
        
        // Save stops and prepare Event Data
        List<RouteCreatedEvent.StopInfo> eventStops = new ArrayList<>();
        
        for (var stopData : osmData.getStops()) {
            if (stopData.getLatitude() == null || stopData.getLongitude() == null) continue;
            
            Stop stop = findOrCreateStop(stopData);
            
            RouteStop routeStop = new RouteStop();
            routeStop.setRoute(route);
            routeStop.setStop(stop);
            routeStop.setStopOrder(stopData.getOrder());
            routeStopRepository.save(routeStop);
            
            eventStops.add(new RouteCreatedEvent.StopInfo(
                stop.getName(), 
                stop.getLatitude(), 
                stop.getLongitude(), 
                stopData.getOrder()
            ));
        }
        
        // Publish Event (Bus Service will listen to this to spawn buses)
        RouteCreatedEvent event = new RouteCreatedEvent(
            route.getId(), 
            route.getName(), 
            route.getDirection(), 
            route.getGeometry(),
            eventStops
        );
        routeEventProducer.publish(event);
    }

    private ValidationResult validateRouteData(OsmRouteData osmData) {
        if (osmData.getGeometryGeoJson() == null || osmData.getGeometryGeoJson().trim().isEmpty()) 
            return ValidationResult.invalid("Geometry is empty");
        if (osmData.getStops() == null || osmData.getStops().isEmpty()) 
            return ValidationResult.invalid("No stops found");
        return ValidationResult.valid();
    }

    private String extractLineName(String fullName) {
        return fullName.contains(":") ? fullName.split(":")[0].trim() : fullName;
    }

    private String determineDirection(String routeName) {
        String lower = routeName.toLowerCase();
        if (lower.contains("retour") || lower.contains("return") || lower.contains("←")) return "RETURN";
        if (lower.contains("circular") || lower.contains("circulaire")) return "CIRCULAR";
        return "GOING";
    }
    
    private Stop findOrCreateStop(com.trajets.dto.OsmStopData stopData) {
        if (stopData.getNodeId() != null) {
            Optional<Stop> existing = stopRepository.findByOsmNodeId(stopData.getNodeId());
            if (existing.isPresent()) return existing.get();
        }
        return stopRepository.findFirstByLatitudeAndLongitude(stopData.getLatitude(), stopData.getLongitude())
                .orElseGet(() -> {
                    Stop s = new Stop();
                    s.setName(stopData.getName());
                    s.setLatitude(stopData.getLatitude());
                    s.setLongitude(stopData.getLongitude());
                    s.setOsmNodeId(stopData.getNodeId());
                    return stopRepository.save(s);
                });
    }
    
    public List<Line> getAllLines() { return lineRepository.findAll(); }
    public Optional<Line> getLineByRef(String ref) { return lineRepository.findByRef(ref); }

    private static class ValidationResult {
        private final boolean valid;
        private final String reason;
        private ValidationResult(boolean valid, String reason) { this.valid = valid; this.reason = reason; }
        static ValidationResult valid() { return new ValidationResult(true, null); }
        static ValidationResult invalid(String reason) { return new ValidationResult(false, reason); }
        boolean isValid() { return valid; }
        String getReason() { return reason; }
    }
}