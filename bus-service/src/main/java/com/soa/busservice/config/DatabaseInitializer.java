package com.soa.busservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.soa.busservice.model.Bus;
import com.soa.busservice.model.BusStatus;
import com.soa.busservice.model.Route;
import com.soa.busservice.repository.BusRepository;
import com.soa.busservice.repository.RouteRepository;
import com.soa.busservice.service.OpenStreetMapTransitFetcher;
import com.soa.busservice.service.OpenStreetMapLocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Database initializer that dynamically fetches and populates routes and buses
 * from OpenStreetMap data for Rabat-Salé-Témara region.
 * 
 * No more hardcoded routes - all data comes from real OpenStreetMap transit information!
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final RouteRepository routeRepository;
    private final BusRepository busRepository;
    private final OpenStreetMapTransitFetcher osmTransitFetcher;
    private final OpenStreetMapLocationService osmLocationService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(String... args) {
        if (routeRepository.count() > 0) {
            log.info("Database already populated, skipping initialization");
            return;
        }

        log.info("========================================");
        log.info("Initializing database with REAL OpenStreetMap data...");
        log.info("Fetching transit routes for Rabat-Salé-Témara region");
        log.info("========================================");

        // Step 1: Fetch real routes from OpenStreetMap
        List<Route> osmRoutes = osmTransitFetcher.fetchTransitRoutes();
        
        if (osmRoutes.isEmpty()) {
            log.warn("No routes fetched from OpenStreetMap! System may not function properly.");
        }
        
        // Step 2: Save routes to database
        List<Route> savedRoutes = saveRoutes(osmRoutes);
        log.info("✓ Saved {} routes to database", savedRoutes.size());
        
        // Step 3: Create buses and assign to routes
        List<Bus> buses = createBusesForRoutes(savedRoutes);
        for (Bus bus : buses) {
            busRepository.save(bus);
        }
        log.info("✓ Created and assigned {} buses to routes", buses.size());
        
        // Step 4: Create some reserve/maintenance buses
        createReserveBuses();
        log.info("✓ Added reserve and maintenance buses");

        log.info("========================================");
        log.info("Database initialization complete!");
        log.info("Routes: {}", savedRoutes.size());
        log.info("Active Buses: {}", buses.size());
        log.info("Reserve Buses: {}", busRepository.count() - buses.size());
        log.info("========================================");

        // CRITICAL: Load route geometries AFTER database is populated
        log.info("Loading route geometries into OpenStreetMapLocationService...");
        try {
            osmLocationService.loadRouteGeometries();
        } catch (Exception e) {
            log.error("Failed to load route geometries: {}", e.getMessage());
        }
    }

    /**
     * Save routes to database with their geometries.
     */
    private List<Route> saveRoutes(List<Route> routes) {
        List<Route> savedRoutes = new ArrayList<>();
        
        for (Route route : routes) {
            try {
                // Check for duplicate line numbers
                if (routeRepository.findByLineNumber(route.getLineNumber()).isPresent()) {
                    log.debug("Route {} already exists, skipping", route.getLineNumber());
                    continue;
                }
                
                // Fetch geometry from OSRM if not available from OSM
                if (route.getGeometry() == null || route.getGeometry().isEmpty()) {
                    log.debug("Route {} missing geometry, attempting to fetch from OSRM", 
                            route.getLineNumber());
                    
                    // Parse origin/destination to coordinates (simplified approach)
                    // In production, you'd use a geocoding service
                    var coords = estimateRouteCoordinates(route);
                    if (coords != null) {
                        var geometry = osmTransitFetcher.fetchRouteGeometryFromOSRM(
                            coords[0], coords[1], coords[2], coords[3]
                        );
                        
                        if (!geometry.isEmpty()) {
                            route.setGeometry(objectMapper.writeValueAsString(geometry));
                            log.debug("Fetched {} geometry points from OSRM for route {}", 
                                    geometry.size(), route.getLineNumber());
                        }
                    }
                }
                
                Route saved = routeRepository.save(route);
                savedRoutes.add(saved);
                
                log.info("Saved route: {} - {} ({} → {})", 
                        route.getLineNumber(), 
                        route.getRouteName(),
                        route.getOrigin(), 
                        route.getDestination());
                        
            } catch (Exception e) {
                log.error("Error saving route {}: {}", route.getLineNumber(), e.getMessage());
            }
        }
        
        return savedRoutes;
    }

    /**
     * Create buses for each route based on route type and capacity needs.
     */
    private List<Bus> createBusesForRoutes(List<Route> routes) {
        List<Bus> buses = new ArrayList<>();
        Random random = new Random();
        
        // Group routes by line number (same line can have GOING and RETURN routes)
        var routesByLine = new java.util.HashMap<String, List<Route>>();
        for (Route route : routes) {
            routesByLine.computeIfAbsent(route.getLineNumber(), k -> new ArrayList<>()).add(route);
        }
        
        // Create buses and distribute them across GOING/RETURN routes
        for (var entry : routesByLine.entrySet()) {
            String lineNumber = entry.getKey();
            List<Route> lineRoutes = entry.getValue();
            
            if (lineRoutes.isEmpty()) continue;
            
            // Use first route to determine bus count and capacity
            Route mainRoute = lineRoutes.get(0);
            int totalBusCount = determineBusCount(mainRoute.getRouteType(), lineNumber);
            int capacity = determineBusCapacity(mainRoute.getRouteType());
            
            // Distribute buses across GOING and RETURN routes
            for (int i = 1; i <= totalBusCount; i++) {
                String prefix = determineMatriculePrefix(mainRoute);
                String matricule = String.format("%s-%s-%03d", 
                        prefix, 
                        lineNumber, 
                        i);
                
                // Alternate between routes (GOING, RETURN, GOING, RETURN...)
                Route assignedRoute = lineRoutes.get((i - 1) % lineRoutes.size());
                
                Bus bus = Bus.builder()
                        .matricule(matricule)
                        .capacity(capacity + random.nextInt(10) - 5) // Add some variation
                        .status(BusStatus.EN_SERVICE)
                        .currentRoute(assignedRoute)
                        .build();
                
                buses.add(bus);
                
                log.debug("Created bus {} for route {} {} (capacity: {})", 
                        matricule, lineNumber, assignedRoute.getDirection(), bus.getCapacity());
            }
        }
        
        return buses;
    }

    /**
     * Determine number of buses needed per route.
     */
    private int determineBusCount(String routeType, String lineNumber) {
        if (routeType == null) return 5;
        
        // High-capacity structuring lines need more buses
        if ("STRUCTURANTE".equals(routeType)) {
            return 5; // Major lines like L01-L10
        }
        
        // Special lines (airport, tram-bus) need more buses
        if ("SPECIALE".equals(routeType)) {
            return 5;
        }
        
        // Intercommunal lines need moderate fleet
        if ("INTERCOMMUNALE".equals(routeType)) {
            return 5;
        }
        
        // Internal city lines need fewer buses
        return 5;
    }

    /**
     * Determine bus capacity based on route type.
     */
    private int determineBusCapacity(String routeType) {
        if (routeType == null) return 80;
        
        return switch (routeType) {
            case "STRUCTURANTE" -> 90;      // High capacity for main lines
            case "INTERCOMMUNALE" -> 85;    // Good capacity for intercity
            case "SPECIALE" -> 100;         // Maximum for special routes
            case "INTERNE_RABAT" -> 70;     // Medium for city routes
            case "INTERNE_SALE" -> 80;      
            case "INTERNE_TEMARA" -> 85;
            default -> 80;
        };
    }

    /**
     * Determine matricule prefix based on route location.
     */
    private String determineMatriculePrefix(Route route) {
        String origin = route.getOrigin() != null ? route.getOrigin().toLowerCase() : "";
        String lineNumber = route.getLineNumber() != null ? route.getLineNumber() : "";
        
        // Salé routes
        if (origin.contains("salé") || origin.contains("sale") || lineNumber.startsWith("L2")) {
            return "SALE";
        }
        
        // Témara routes
        if (origin.contains("témara") || origin.contains("temara") || lineNumber.startsWith("L3")) {
            return "TMR";
        }
        
        // Default to Rabat
        return "RBT";
    }

    /**
     * Create reserve and maintenance buses.
     */
    private void createReserveBuses() {
        List<Bus> reserveBuses = List.of(
            createReserveBus("RBT-RESERVE-001", 90, BusStatus.HORS_SERVICE),
            createReserveBus("RBT-RESERVE-002", 90, BusStatus.EN_MAINTENANCE),
            createReserveBus("RBT-RESERVE-003", 85, BusStatus.HORS_SERVICE),
            createReserveBus("SALE-RESERVE-001", 85, BusStatus.EN_MAINTENANCE),
            createReserveBus("SALE-RESERVE-002", 80, BusStatus.HORS_SERVICE),
            createReserveBus("TMR-RESERVE-001", 85, BusStatus.EN_MAINTENANCE)
        );
        
        for (Bus bus : reserveBuses) {
            busRepository.save(bus);
        }
    }

    private Bus createReserveBus(String matricule, int capacity, BusStatus status) {
        return Bus.builder()
                .matricule(matricule)
                .capacity(capacity)
                .status(status)
                .currentRoute(null)
                .build();
    }

    /**
     * Estimate route coordinates based on origin/destination names.
     * This is a simplified geocoding approach.
     * Returns [startLat, startLon, endLat, endLon] or null.
     */
    private double[] estimateRouteCoordinates(Route route) {
        // Major location coordinates in Rabat-Salé-Témara
        var locations = new java.util.HashMap<String, double[]>();
        
        // Rabat locations
        locations.put("rabat", new double[]{34.0209, -6.8416});
        locations.put("agdal", new double[]{33.9816, -6.8498});
        locations.put("hassan", new double[]{34.0236, -6.8236});
        locations.put("bab chellah", new double[]{33.9889, -6.8261});
        locations.put("bab el had", new double[]{34.0209, -6.8416});
        locations.put("youssoufia", new double[]{34.0150, -6.8350});
        locations.put("souissi", new double[]{33.9850, -6.8750});
        
        // Salé locations
        locations.put("salé", new double[]{34.0531, -6.7982});
        locations.put("sale", new double[]{34.0531, -6.7982});
        locations.put("tabriquet", new double[]{34.0620, -6.7880});
        locations.put("bouchouk", new double[]{34.0620, -6.7880});
        
        // Témara locations
        locations.put("témara", new double[]{33.9280, -6.9063});
        locations.put("temara", new double[]{33.9280, -6.9063});
        
        String origin = route.getOrigin() != null ? route.getOrigin().toLowerCase() : "";
        String destination = route.getDestination() != null ? route.getDestination().toLowerCase() : "";
        
        // Find matching coordinates
        double[] startCoords = null;
        double[] endCoords = null;
        
        for (var entry : locations.entrySet()) {
            if (origin.contains(entry.getKey())) {
                startCoords = entry.getValue();
            }
            if (destination.contains(entry.getKey())) {
                endCoords = entry.getValue();
            }
        }
        
        // If both found, return array
        if (startCoords != null && endCoords != null) {
            return new double[]{
                startCoords[0], startCoords[1],  // start lat, lon
                endCoords[0], endCoords[1]       // end lat, lon
            };
        }
        
        return null;
    }
}