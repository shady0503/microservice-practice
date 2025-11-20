package com.soa.busservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.soa.busservice.dto.kafka.GpsRawLocationEvent;
import com.soa.busservice.model.Route;
import com.soa.busservice.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

/**
 * Multi-threaded service that streams bus locations along REAL OpenStreetMap routes.
 * Uses thread pool and separate Kafka topics per bus line for optimal performance.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpenStreetMapLocationService {

    private final KafkaTemplate<String, GpsRawLocationEvent> kafkaTemplate;
    private final BusService busService;
    private final RouteRepository routeRepository;
    private final ObjectMapper objectMapper;

    @Value("${openstreetmap.enabled:true}")
    private boolean enabled;

    // Cache for route geometries loaded from database
    private final Map<String, List<LatLng>> routeGeometries = new ConcurrentHashMap<>();
    
    // Track current position along route for each bus
    private final Map<String, Integer> busRouteProgress = new ConcurrentHashMap<>();
    
    // Thread pool for parallel GPS generation
    private final ExecutorService executorService = Executors.newFixedThreadPool(
        Runtime.getRuntime().availableProcessors()
    );
    
    // Random generator for realistic speed variation
    private final Random random = new Random();
    
    // Cache buses grouped by line number for efficient processing
    private final Map<String, List<com.soa.busservice.model.Bus>> busesByLine = new ConcurrentHashMap<>();

    /**
     * Simple LatLng class to hold coordinates
     */
    public static class LatLng {
        public final double lat;
        public final double lng;

        public LatLng(double lat, double lng) {
            this.lat = lat;
            this.lng = lng;
        }

        @Override
        public String toString() {
            return String.format("%.5f,%.5f", lat, lng);
        }
    }

    /**
     * Load all route geometries from database.
     * Called by DatabaseInitializer after routes are saved.
     */
    public void loadRouteGeometries() {
        if (!enabled) {
            log.warn("OpenStreetMap location streaming is DISABLED");
            return;
        }
        
        log.info("========================================");
        log.info("Initializing OpenStreetMap Location Service");
        log.info("Loading route geometries from database...");
        log.info("========================================");
        
        loadRouteGeometriesFromDatabase();
        
        log.info("========================================");
        log.info("OpenStreetMap Location Service Ready");
        log.info("Loaded {} routes with real OSM geometries", routeGeometries.size());
        log.info("========================================");
    }
    
    /**
     * Load ALL route geometries from database.
     * These geometries come from real OpenStreetMap data!
     */
    private void loadRouteGeometriesFromDatabase() {
        log.info("Fetching all routes from database...");
        
        List<Route> allRoutes = routeRepository.findAll();
        log.info("Found {} routes in database", allRoutes.size());
        
        int loadedCount = 0;
        int missingGeometryCount = 0;
        
        for (Route route : allRoutes) {
            try {
                String routeId = route.getRouteId().toString();
                String geometry = route.getGeometry();
                
                if (geometry != null && !geometry.trim().isEmpty()) {
                    // Parse JSON geometry: [[lat, lon], [lat, lon], ...]
                    List<List<Double>> coordinates = objectMapper.readValue(
                        geometry, 
                        new TypeReference<List<List<Double>>>() {}
                    );
                    
                    // Convert to LatLng objects
                    List<LatLng> routePoints = coordinates.stream()
                        .map(coord -> new LatLng(coord.get(0), coord.get(1)))
                        .toList();
                    
                    if (!routePoints.isEmpty()) {
                        routeGeometries.put(routeId, routePoints);
                        loadedCount++;
                        
                        log.info("✓ Loaded route {} ({}) with {} waypoints", 
                                route.getLineNumber(), 
                                route.getRouteName(),
                                routePoints.size());
                    } else {
                        log.warn("Route {} has empty geometry", route.getLineNumber());
                        missingGeometryCount++;
                    }
                } else {
                    log.warn("Route {} ({}) has NO geometry data - buses won't move realistically", 
                            route.getLineNumber(), route.getRouteName());
                    missingGeometryCount++;
                    
                    // Create a simple fallback route
                    createFallbackGeometry(route);
                }
                
            } catch (Exception e) {
                log.error("Error loading geometry for route {}: {}", 
                        route.getLineNumber(), e.getMessage());
                missingGeometryCount++;
            }
        }
        
        log.info("Geometry loading complete:");
        log.info("  ✓ Successfully loaded: {} routes", loadedCount);
        log.info("  ⚠ Missing geometry: {} routes", missingGeometryCount);
        
        // Get all buses to understand assignments
        var allBuses = busService.getAllBuses();
        Set<String> activeRouteIds = new HashSet<>();
        for (var bus : allBuses) {
            if (bus.getCurrentRouteId() != null) {
                activeRouteIds.add(bus.getCurrentRouteId());
            }
        }
        
        log.info("Found {} buses assigned to {} unique routes", 
                allBuses.size(), activeRouteIds.size());
    }
    
    /**
     * Create a simple fallback geometry for routes without OSM data.
     * This creates a straight line between estimated origin and destination.
     */
    private void createFallbackGeometry(Route route) {
        try {
            // Estimate coordinates based on route name/origin/destination
            double[] coords = estimateRouteEndpoints(route);
            
            if (coords != null) {
                List<LatLng> fallbackRoute = new ArrayList<>();
                
                // Create 20 interpolated points between start and end
                for (int i = 0; i <= 20; i++) {
                    double ratio = (double) i / 20;
                    double lat = coords[0] + (coords[2] - coords[0]) * ratio;
                    double lon = coords[1] + (coords[3] - coords[1]) * ratio;
                    fallbackRoute.add(new LatLng(lat, lon));
                }
                
                routeGeometries.put(route.getRouteId().toString(), fallbackRoute);
                log.debug("Created fallback geometry for route {}", route.getLineNumber());
            }
        } catch (Exception e) {
            log.error("Error creating fallback geometry for route {}: {}", 
                    route.getLineNumber(), e.getMessage());
        }
    }
    
    /**
     * Estimate route endpoints based on origin/destination.
     * Returns [startLat, startLon, endLat, endLon] or null.
     */
    private double[] estimateRouteEndpoints(Route route) {
        // Major locations map
        var locations = new HashMap<String, double[]>();
        
        // Rabat
        locations.put("rabat", new double[]{34.0209, -6.8416});
        locations.put("agdal", new double[]{33.9816, -6.8498});
        locations.put("hassan", new double[]{34.0236, -6.8236});
        locations.put("chellah", new double[]{33.9889, -6.8261});
        locations.put("had", new double[]{34.0209, -6.8416});
        
        // Salé
        locations.put("salé", new double[]{34.0531, -6.7982});
        locations.put("sale", new double[]{34.0531, -6.7982});
        
        // Témara
        locations.put("témara", new double[]{33.9280, -6.9063});
        locations.put("temara", new double[]{33.9280, -6.9063});
        
        String origin = route.getOrigin() != null ? route.getOrigin().toLowerCase() : "";
        String destination = route.getDestination() != null ? route.getDestination().toLowerCase() : "";
        
        double[] start = null;
        double[] end = null;
        
        // Find matching locations
        for (var entry : locations.entrySet()) {
            if (origin.contains(entry.getKey())) start = entry.getValue();
            if (destination.contains(entry.getKey())) end = entry.getValue();
        }
        
        if (start != null && end != null) {
            return new double[]{start[0], start[1], end[0], end[1]};
        }
        
        // Default to Rabat center
        return new double[]{34.0209, -6.8416, 34.0209, -6.8416};
    }

    /**
     * Periodically stream GPS locations for all buses along their assigned routes.
     * Uses thread pool and processes buses by line in parallel for optimal performance.
     */
    @Scheduled(fixedRateString = "${openstreetmap.refresh-interval:30000}")
    public void fetchAndStreamBusLocations() {
        if (!enabled) {
            return;
        }

        try {
            var allBuses = busService.getAllBusEntities();
            
            if (allBuses.isEmpty()) {
                log.debug("No buses found in system");
                return;
            }
            
            // Group buses by line number for efficient parallel processing
            Map<String, List<com.soa.busservice.model.Bus>> busesGroupedByLine = allBuses.stream()
                .filter(bus -> bus.getCurrentRoute() != null)
                .collect(Collectors.groupingBy(
                    bus -> getLineNumber(bus.getCurrentRoute().getRouteId().toString()),
                    Collectors.toList()
                ));
            
            log.debug("Streaming GPS for {} buses across {} lines", 
                allBuses.size(), busesGroupedByLine.size());
            
            // Process each line in parallel using thread pool
            List<CompletableFuture<Void>> futures = new ArrayList<>();
            
            for (Map.Entry<String, List<com.soa.busservice.model.Bus>> entry : busesGroupedByLine.entrySet()) {
                String lineNumber = entry.getKey();
                List<com.soa.busservice.model.Bus> buses = entry.getValue();
                
                CompletableFuture<Void> future = CompletableFuture.runAsync(
                    () -> processLineGpsUpdates(lineNumber, buses),
                    executorService
                );
                
                futures.add(future);
            }
            
            // Wait for all lines to complete (with timeout)
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                .get(5, TimeUnit.SECONDS);
            
        } catch (TimeoutException e) {
            log.warn("GPS update cycle timed out after 5 seconds");
        } catch (Exception e) {
            log.error("Error in fetchAndStreamBusLocations: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Process GPS updates for all buses on a specific line.
     * Publishes to line-specific Kafka topic for better partitioning.
     */
    private void processLineGpsUpdates(String lineNumber, List<com.soa.busservice.model.Bus> buses) {
        String topicName = "gps.line." + lineNumber.toLowerCase().replaceAll("[^a-z0-9]", "");
        
        for (var bus : buses) {
            try {
                String routeId = bus.getCurrentRoute().getRouteId().toString();
                
                // Get next location along the bus's actual route
                GpsRawLocationEvent locationEvent = getNextLocationAlongRoute(
                    bus.getBusId().toString(), 
                    routeId
                );
                
                // Enrich with bus metadata
                locationEvent.setBusMatricule(bus.getMatricule());
                locationEvent.setRouteName(getRouteName(routeId));
                locationEvent.setLineNumber(lineNumber);
                locationEvent.setRouteId(routeId);
                locationEvent.setDirection(getRouteDirection(routeId));
                locationEvent.setBusCapacity(bus.getCapacity());
                locationEvent.setBusStatus(bus.getStatus().name());
                
                // Publish to line-specific Kafka topic
                kafkaTemplate.send(topicName, 
                        bus.getBusId().toString(), 
                        locationEvent);
                
                log.debug("Published GPS for bus {} on route {} at [{}, {}]", 
                    bus.getMatricule(),
                    lineNumber,
                    locationEvent.getLatitude(), 
                    locationEvent.getLongitude());
                
            } catch (Exception e) {
                log.error("Error streaming location for bus {}: {}", 
                        bus.getBusId(), e.getMessage());
            }
        }
    }

    /**
     * Get next location along the bus's assigned route from real OSM geometry.
     * Moves bus progressively through waypoints.
     */
    private GpsRawLocationEvent getNextLocationAlongRoute(String busId, String routeId) {
        // Get route geometry
        List<LatLng> route = routeGeometries.get(routeId);
        
        if (route == null || route.isEmpty()) {
            log.warn("No geometry found for route {}, using fallback", routeId);
            return createFallbackLocation(busId);
        }
        
        // Get current progress along route, with initial stagger to prevent overlap
        int currentIndex = busRouteProgress.computeIfAbsent(busId, id -> {
            // Distribute buses evenly along route based on their ID hash
            return Math.abs(id.hashCode()) % route.size();
        });
        
        // Move to next waypoint (cycle through route)
        currentIndex = (currentIndex + 1) % route.size();
        busRouteProgress.put(busId, currentIndex);
        
        LatLng currentPosition = route.get(currentIndex);
        
        // Calculate realistic speed (20-60 km/h for urban buses)
        // Add some variation based on position (slower at stops, faster between)
        double baseSpeed = 35.0;
        double speedVariation = random.nextDouble() * 20 - 10; // -10 to +10 km/h
        double speed = Math.max(0, baseSpeed + speedVariation);
        
        return GpsRawLocationEvent.builder()
                .busId(busId)
                .latitude(currentPosition.lat)
                .longitude(currentPosition.lng)
                .speed(speed)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Create fallback location for buses without route geometry.
     * Uses predefined safe locations within city boundaries to avoid water.
     */
    private GpsRawLocationEvent createFallbackLocation(String busId) {
        // Predefined safe locations within Rabat-Salé-Témara (on land)
        double[][] safeLocations = {
            {34.0209, -6.8416},  // Rabat Centre
            {33.9816, -6.8498},  // Agdal
            {34.0236, -6.8236},  // Hassan
            {34.0531, -6.7982},  // Salé
            {33.9280, -6.9063},  // Témara
            {34.0150, -6.8350},  // Youssoufia
            {33.9889, -6.8261},  // Bab Chellah
            {34.0120, -6.8380}   // Hay el Fath
        };
        
        // Pick a safe location based on bus ID hash
        int locationIndex = Math.abs(busId.hashCode()) % safeLocations.length;
        double baseLat = safeLocations[locationIndex][0];
        double baseLon = safeLocations[locationIndex][1];
        
        // Add small random offset (max 500 meters) to avoid all buses on exact same spot
        double lat = baseLat + (random.nextDouble() - 0.5) * 0.005;  // ~250m
        double lon = baseLon + (random.nextDouble() - 0.5) * 0.005;  // ~250m
        double speed = 20 + random.nextDouble() * 40;
        
        return GpsRawLocationEvent.builder()
                .busId(busId)
                .latitude(lat)
                .longitude(lon)
                .speed(speed)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Get route line number from database.
     */
    private String getLineNumber(String routeId) {
        try {
            UUID routeUuid = UUID.fromString(routeId);
            return routeRepository.findById(routeUuid)
                    .map(Route::getLineNumber)
                    .orElse("Unknown");
        } catch (Exception e) {
            return "Unknown";
        }
    }
    
    /**
     * Get route name from database.
     */
    private String getRouteName(String routeId) {
        try {
            UUID routeUuid = UUID.fromString(routeId);
            return routeRepository.findById(routeUuid)
                    .map(Route::getRouteName)
                    .orElse("Unknown Route");
        } catch (Exception e) {
            return "Unknown Route";
        }
    }
    
    /**
     * Get route direction from database.
     */
    private String getRouteDirection(String routeId) {
        try {
            UUID routeUuid = UUID.fromString(routeId);
            return routeRepository.findById(routeUuid)
                    .map(Route::getDirection)
                    .orElse("GOING");
        } catch (Exception e) {
            return "GOING";
        }
    }

    /**
     * Shutdown hook
     */
    public void shutdown() {
        log.info("OpenStreetMap location service shutting down");
        routeGeometries.clear();
        busRouteProgress.clear();
    }
}
