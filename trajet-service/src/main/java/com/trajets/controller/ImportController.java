package com.trajets.controller;

import com.trajets.dto.request.RouteGeometryImportRequest;
import com.trajets.service.BusRouteImportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/import")
@Slf4j
public class ImportController {

    private final BusRouteImportService busRouteImportService;

    public ImportController(BusRouteImportService busRouteImportService) {
        this.busRouteImportService = busRouteImportService;
    }

    /**
     * POST /api/import/bus-routes
     * Imports all bus routes from Rabat, Salé, and Témara via Overpass API
     * 
     * Returns:
     * {
     *   "success": true,
     *   "linesImported": 15,
     *   "stopsImported": 250,
     *   "trajetsImported": 15
     * }
     */
    @PostMapping("/bus-routes")
    public ResponseEntity<Map<String, Object>> importBusRoutes() {
        log.info("Received request to import bus routes from Overpass API");
        
        try {
            Map<String, Object> result = busRouteImportService.importAllBusRoutes();
            
            if (Boolean.TRUE.equals(result.get("success"))) {
                log.info("Import completed successfully: {}", result);
                return ResponseEntity.ok(result);
            } else {
                log.warn("Import failed: {}", result);
                return ResponseEntity.status(500).body(result);
            }
        } catch (Exception e) {
            log.error("Error during import", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Import failed: " + e.getMessage()
            ));
        }
    }

    /**
     * POST /api/import/geojson-routes
     * Accepts pre-processed GeoJSON route data from frontend (via osmtogeojson)
     * This avoids the overlapping geometry issues by using proper OSM→GeoJSON conversion
     * 
     * Request body:
     * {
     *   "routes": [
     *     {
     *       "routeId": "123456",
     *       "ref": "32H",
     *       "name": "Route 32H",
     *       "from": "Origin",
     *       "to": "Destination",
     *       "operator": "ALSA",
     *       "colour": "#ff0000",
     *       "geometry": { "type": "LineString", "coordinates": [...] },
     *       "stops": [...]
     *     }
     *   ]
     * }
     */
    @PostMapping("/geojson-routes")
    public ResponseEntity<Map<String, Object>> importGeoJsonRoutes(
            @RequestBody RouteGeometryImportRequest request) {
        log.info("Received request to import {} pre-processed GeoJSON routes", 
                request.getRoutes() != null ? request.getRoutes().size() : 0);
        
        try {
            Map<String, Object> result = busRouteImportService.importGeoJsonRoutes(request);
            
            if (Boolean.TRUE.equals(result.get("success"))) {
                log.info("GeoJSON import completed successfully: {}", result);
                return ResponseEntity.ok(result);
            } else {
                log.warn("GeoJSON import failed: {}", result);
                return ResponseEntity.status(500).body(result);
            }
        } catch (Exception e) {
            log.error("Error during GeoJSON import", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Import failed: " + e.getMessage()
            ));
        }
    }
}
