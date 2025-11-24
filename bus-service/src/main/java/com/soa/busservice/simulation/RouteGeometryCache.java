package com.soa.busservice.simulation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RouteGeometryCache {
    private final Map<String, List<double[]>> routePaths = new ConcurrentHashMap<>();
    private final Map<String, Set<Integer>> routeStopsIndices = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();

    public void cacheRoute(String routeName, String geoJson) {
        try {
            JsonNode root = mapper.readTree(geoJson);
            List<double[]> path = new ArrayList<>();

            // Handle both LineString and MultiLineString to ensure continuity
            if (root.has("coordinates")) {
                JsonNode coordinates = root.get("coordinates");
                if ("MultiLineString".equalsIgnoreCase(root.path("type").asText())) {
                    for (JsonNode segment : coordinates) {
                        for (JsonNode point : segment) {
                            path.add(new double[]{point.get(1).asDouble(), point.get(0).asDouble()});
                        }
                    }
                } else {
                    for (JsonNode point : coordinates) {
                        path.add(new double[]{point.get(1).asDouble(), point.get(0).asDouble()});
                    }
                }
            }

            if (!path.isEmpty()) {
                routePaths.put(routeName, path);
                
                // Heuristic: Simulate stops every ~15 nodes and at the ends
                // In a real production system, these indices would come from the route-service
                Set<Integer> stops = new HashSet<>();
                stops.add(0); // Start (Terminus)
                for (int i = 10; i < path.size() - 10; i += 15) {
                    stops.add(i);
                }
                stops.add(path.size() - 1); // End (Terminus)
                routeStopsIndices.put(routeName, stops);
            }
        } catch (Exception e) {
            System.err.println("Invalid geometry for " + routeName + ": " + e.getMessage());
        }
    }

    public List<double[]> getPath(String routeName) {
        return routePaths.get(routeName);
    }

    public boolean isStop(String routeName, int index) {
        Set<Integer> stops = routeStopsIndices.get(routeName);
        return stops != null && stops.contains(index);
    }
    
    public int getRouteSize(String routeName) {
        List<double[]> path = routePaths.get(routeName);
        return path != null ? path.size() : 0;
    }
}