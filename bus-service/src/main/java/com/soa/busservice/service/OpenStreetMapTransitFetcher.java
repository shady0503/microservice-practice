package com.soa.busservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.soa.busservice.model.Route;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

/**
 * Service to fetch real public transit data from OpenStreetMap for Rabat-Salé-Témara region.
 * Uses Overpass API to query bus routes and their geometries.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpenStreetMapTransitFetcher {

    private final ObjectMapper objectMapper;
    
    // Overpass API endpoint (public and free)
    private static final String OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
    
    // Bounding box for Rabat-Salé-Témara metropolitan area
    // Format: (south, west, north, east)
    private static final String RABAT_SALE_TEMARA_BBOX = "33.85,-7.10,34.15,-6.70";
    
    /**
     * Fetch all bus routes in Rabat-Salé-Témara region from OpenStreetMap.
     * Retries with exponential backoff if API is temporarily unavailable.
     * 
     * @return List of Route objects with real data from OSM
     */
    public List<Route> fetchTransitRoutes() {
        log.info("Fetching real transit routes from OpenStreetMap for Rabat-Salé-Témara...");
        
        int maxRetries = 3;
        int retryDelay = 5000; // Start with 5 seconds
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Build Overpass QL query to fetch bus routes
                String overpassQuery = buildOverpassQuery();
                
                // Execute query with increased buffer size for large responses
                WebClient webClient = WebClient.builder()
                        .baseUrl(OVERPASS_API_URL)
                        .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB buffer
                        .build();
                
                log.info("Attempting to fetch routes (attempt {}/{})", attempt, maxRetries);
                
                String response = webClient.post()
                        .bodyValue(overpassQuery)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
                
                if (response != null) {
                    List<Route> routes = parseOverpassResponse(response);
                    log.info("✓ Successfully fetched {} transit routes from OpenStreetMap", routes.size());
                    return routes;
                } else {
                    log.warn("No response from Overpass API (attempt {}/{})", attempt, maxRetries);
                }
                
            } catch (Exception e) {
                log.error("Error fetching routes (attempt {}/{}): {}", attempt, maxRetries, e.getMessage());
                
                if (attempt < maxRetries) {
                    log.info("Retrying in {} seconds...", retryDelay / 1000);
                    try {
                        Thread.sleep(retryDelay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted while waiting to retry", ie);
                    }
                    retryDelay *= 2; // Exponential backoff
                } else {
                    log.error("CRITICAL: All {} attempts failed. Cannot initialize without route data.", maxRetries);
                    throw new RuntimeException("Cannot initialize system without OpenStreetMap data after " + maxRetries + " attempts", e);
                }
            }
        }
        
        throw new RuntimeException("Failed to fetch routes after " + maxRetries + " attempts");
    }
    
    /**
     * Build Overpass QL query to fetch bus routes in the region.
     */
    private String buildOverpassQuery() {
        // Overpass QL to fetch bus route relations with their ways and nodes
        return String.format("""
                [out:json][timeout:60];
                (
                  // Fetch bus route relations
                  relation["route"="bus"](%s);
                  relation["route"="trolleybus"](%s);
                );
                // Recursively fetch all ways and nodes
                out body;
                >;
                out skel qt;
                """, RABAT_SALE_TEMARA_BBOX, RABAT_SALE_TEMARA_BBOX);
    }
    
    /**
     * Parse Overpass API JSON response and extract route information.
     */
    private List<Route> parseOverpassResponse(String jsonResponse) {
        List<Route> routes = new ArrayList<>();
        
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode elements = root.get("elements");
            
            if (elements == null || !elements.isArray()) {
                log.warn("No elements found in Overpass response");
                return routes;
            }
            
            // First pass: collect all nodes and ways
            Map<Long, JsonNode> nodes = new HashMap<>();
            Map<Long, JsonNode> ways = new HashMap<>();
            List<JsonNode> relations = new ArrayList<>();
            
            for (JsonNode element : elements) {
                String type = element.get("type").asText();
                long id = element.get("id").asLong();
                
                switch (type) {
                    case "node" -> nodes.put(id, element);
                    case "way" -> ways.put(id, element);
                    case "relation" -> relations.add(element);
                }
            }
            
            log.info("Parsed {} nodes, {} ways, {} relations", nodes.size(), ways.size(), relations.size());
            
            // Second pass: process route relations
            for (JsonNode relation : relations) {
                try {
                    Route route = parseRouteRelation(relation, ways, nodes);
                    if (route != null && route.getLineNumber() != null) {
                        routes.add(route);
                        log.debug("Parsed route: {} - {}", route.getLineNumber(), route.getRouteName());
                    }
                } catch (Exception e) {
                    log.warn("Error parsing route relation: {}", e.getMessage());
                }
            }
            
        } catch (Exception e) {
            log.error("Error parsing Overpass response: {}", e.getMessage(), e);
        }
        
        return routes;
    }
    
    /**
     * Parse a single route relation and extract route details.
     */
    private Route parseRouteRelation(JsonNode relation, Map<Long, JsonNode> ways, Map<Long, JsonNode> nodes) {
        JsonNode tags = relation.get("tags");
        if (tags == null) return null;
        
        // Extract route metadata
        String ref = getTagValue(tags, "ref"); // Line number (e.g., "L01", "18")
        String name = getTagValue(tags, "name"); // Route name
        String from = getTagValue(tags, "from");
        String to = getTagValue(tags, "to");
        String routeType = determineRouteType(tags);
        
        // Ensure we have at least a reference number
        if (ref == null || ref.trim().isEmpty()) {
            ref = "Line-" + relation.get("id").asLong();
        }
        
        // Normalize line number format (ensure it starts with 'L')
        if (!ref.startsWith("L") && ref.matches("\\d+.*")) {
            ref = "L" + ref;
        }
        
        // Build route name
        String routeName = buildRouteName(name, from, to, ref);
        
        // Extract route geometry from member ways
        List<List<Double>> geometry = extractRouteGeometry(relation, ways, nodes);
        
        // Determine direction from tags or route name
        String direction = determineDirection(tags, routeName, from, to);
        
        // Create Route entity
        Route route = Route.builder()
                .lineNumber(ref)
                .routeName(routeName)
                .origin(from != null ? from : "Unknown")
                .destination(to != null ? to : "Unknown")
                .routeType(routeType)
                .direction(direction)
                .isActive(true)
                .build();
        
        // Store geometry as JSON string
        if (!geometry.isEmpty()) {
            try {
                String geometryJson = objectMapper.writeValueAsString(geometry);
                route.setGeometry(geometryJson);
                log.debug("Route {} has {} geometry points", ref, geometry.size());
            } catch (Exception e) {
                log.warn("Error serializing geometry for route {}: {}", ref, e.getMessage());
            }
        }
        
        return route;
    }
    
    /**
     * Extract route geometry from relation members (ways and nodes).
     * Attempts to connect ways in proper order and fills gaps using OSRM routing.
     */
    private List<List<Double>> extractRouteGeometry(JsonNode relation, Map<Long, JsonNode> ways, Map<Long, JsonNode> nodes) {
        List<List<Double>> coordinates = new ArrayList<>();
        
        JsonNode members = relation.get("members");
        if (members == null) return coordinates;
        
        // Extract way members with their node sequences
        List<List<Long>> wayNodeSequences = new ArrayList<>();
        for (JsonNode member : members) {
            String type = member.get("type").asText();
            String role = member.has("role") ? member.get("role").asText() : "";
            
            // Look for ways that are part of the route (not just stops)
            if ("way".equals(type) && !"platform".equals(role) && !"stop".equals(role)) {
                long wayId = member.get("ref").asLong();
                JsonNode way = ways.get(wayId);
                if (way == null) continue;
                
                JsonNode wayNodes = way.get("nodes");
                if (wayNodes == null) continue;
                
                List<Long> nodeSequence = new ArrayList<>();
                for (JsonNode nodeIdNode : wayNodes) {
                    nodeSequence.add(nodeIdNode.asLong());
                }
                if (!nodeSequence.isEmpty()) {
                    wayNodeSequences.add(nodeSequence);
                }
            }
        }
        
        // Convert all node IDs to coordinates first
        List<List<List<Double>>> wayCoordinates = new ArrayList<>();
        for (List<Long> wayNodes : wayNodeSequences) {
            List<List<Double>> wayCoords = new ArrayList<>();
            for (Long nodeId : wayNodes) {
                JsonNode node = nodes.get(nodeId);
                if (node != null && node.has("lat") && node.has("lon")) {
                    double lat = node.get("lat").asDouble();
                    double lon = node.get("lon").asDouble();
                    wayCoords.add(List.of(lat, lon));
                }
            }
            if (!wayCoords.isEmpty()) {
                wayCoordinates.add(wayCoords);
            }
        }
        
        if (wayCoordinates.isEmpty()) {
            return coordinates;
        }
        
        // Start with first way
        coordinates.addAll(wayCoordinates.get(0));
        
        // Connect remaining ways, checking direction and reversing if needed
        for (int i = 1; i < wayCoordinates.size(); i++) {
            List<List<Double>> currentWay = new ArrayList<>(wayCoordinates.get(i));
            List<Double> lastPoint = coordinates.get(coordinates.size() - 1);
            List<Double> firstPoint = currentWay.get(0);
            List<Double> lastPointOfWay = currentWay.get(currentWay.size() - 1);
            
            // Calculate distances to determine correct direction
            double distanceToStart = Math.sqrt(
                Math.pow(lastPoint.get(0) - firstPoint.get(0), 2) +
                Math.pow(lastPoint.get(1) - firstPoint.get(1), 2)
            );
            
            double distanceToEnd = Math.sqrt(
                Math.pow(lastPoint.get(0) - lastPointOfWay.get(0), 2) +
                Math.pow(lastPoint.get(1) - lastPointOfWay.get(1), 2)
            );
            
            // If way end is closer to our current position, reverse the way
            if (distanceToEnd < distanceToStart) {
                Collections.reverse(currentWay);
                distanceToStart = distanceToEnd; // Update distance after reversal
            }
            
            // Fill gaps > 0.001 degrees (~111 meters) using OSRM routing
            if (distanceToStart > 0.001) {
                log.info("Gap detected ({} degrees / ~{}m), filling with OSRM",
                    String.format("%.4f", distanceToStart),
                    String.format("%.0f", distanceToStart * 111000));
                
                try {
                    List<List<Double>> gapGeometry = fetchRouteGeometryFromOSRM(
                        lastPoint.get(0), lastPoint.get(1),
                        currentWay.get(0).get(0), currentWay.get(0).get(1)
                    );
                    if (!gapGeometry.isEmpty()) {
                        // Add gap fill coordinates (skip first to avoid duplicate)
                        coordinates.addAll(gapGeometry.subList(1, gapGeometry.size()));
                        log.debug("Filled gap with {} OSRM points", gapGeometry.size());
                    }
                } catch (Exception e) {
                    log.warn("Failed to fill gap with OSRM: {}", e.getMessage());
                }
            }
            
            // Add current way (skip first point if very close to avoid duplicates)
            int startIdx = (distanceToStart < 0.00001) ? 1 : 0;
            coordinates.addAll(currentWay.subList(startIdx, currentWay.size()));
        }
        
        return coordinates;
    }
    
    /**
     * Determine route type based on tags.
     */
    private String determineRouteType(JsonNode tags) {
        String ref = getTagValue(tags, "ref");
        
        if (ref != null) {
            // Structurantes: L01-L10
            if (ref.matches("L0[1-9]|L10")) {
                return "STRUCTURANTE";
            }
            // Intercommunales: L21-L40
            if (ref.matches("L[23]\\d")) {
                return "INTERCOMMUNALE";
            }
            // Internes Rabat: L101-L108
            if (ref.matches("L10[1-8]")) {
                return "INTERNE_RABAT";
            }
            // Internes Salé: L201-L204
            if (ref.matches("L20[1-4]")) {
                return "INTERNE_SALE";
            }
            // Internes Témara: L303, L306
            if (ref.matches("L30[36].*")) {
                return "INTERNE_TEMARA";
            }
            // Spéciales: L30, L210
            if (ref.matches("L30|L210.*")) {
                return "SPECIALE";
            }
        }
        
        return "STANDARD";
    }
    
    /**
     * Build a descriptive route name.
     */
    private String buildRouteName(String name, String from, String to, String ref) {
        if (name != null && !name.trim().isEmpty()) {
            return name;
        }
        
        if (from != null && to != null) {
            return from + " ↔ " + to;
        }
        
        return "Bus Line " + ref;
    }
    
    /**
     * Determine route direction from tags or route name.
     */
    private String determineDirection(JsonNode tags, String routeName, String from, String to) {
        // Check for explicit direction tag
        if (tags.has("direction")) {
            String dir = tags.get("direction").asText().toLowerCase();
            if (dir.contains("forward") || dir.contains("going") || dir.equals("1")) {
                return "GOING";
            }
            if (dir.contains("backward") || dir.contains("return") || dir.equals("2")) {
                return "RETURN";
            }
        }
        
        // Check route name for direction indicators
        if (routeName != null) {
            String lower = routeName.toLowerCase();
            if (lower.contains("aller") || lower.contains("going") || lower.contains(" > ")) {
                return "GOING";
            }
            if (lower.contains("retour") || lower.contains("return") || lower.contains(" < ")) {
                return "RETURN";
            }
            if (lower.contains("circulaire") || lower.contains("circular") || lower.contains("loop")) {
                return "CIRCULAR";
            }
        }
        
        // Check if origin and destination are the same (circular route)
        if (from != null && to != null && from.equalsIgnoreCase(to)) {
            return "CIRCULAR";
        }
        
        // Default to GOING
        return "GOING";
    }
    
    /**
     * Get tag value safely.
     */
    private String getTagValue(JsonNode tags, String key) {
        if (tags.has(key)) {
            return tags.get(key).asText();
        }
        return null;
    }
    
    /**
     * Fetch route geometry from OSRM for routes without geometry.
     * This is a fallback for routes where OSM didn't provide complete geometry.
     */
    public List<List<Double>> fetchRouteGeometryFromOSRM(double startLat, double startLon, 
                                                         double endLat, double endLon) {
        List<List<Double>> geometry = new ArrayList<>();
        
        try {
            String osrmUrl = "http://router.project-osrm.org/route/v1/driving";
            String coordinates = String.format("%f,%f;%f,%f", startLon, startLat, endLon, endLat);
            String url = osrmUrl + "/" + coordinates + "?overview=full&geometries=geojson";
            
            WebClient webClient = WebClient.create();
            String response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                if (root.has("routes") && root.get("routes").size() > 0) {
                    JsonNode coords = root.get("routes").get(0).get("geometry").get("coordinates");
                    
                    for (JsonNode coord : coords) {
                        double lon = coord.get(0).asDouble();
                        double lat = coord.get(1).asDouble();
                        geometry.add(List.of(lat, lon));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error fetching geometry from OSRM: {}", e.getMessage());
        }
        
        return geometry;
    }
}
