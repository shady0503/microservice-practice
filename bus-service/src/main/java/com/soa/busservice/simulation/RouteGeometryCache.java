package com.soa.busservice.simulation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RouteGeometryCache {
    private final Map<String, List<double[]>> routePaths = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();

    public void cacheRoute(String routeName, String geoJson) {
        try {
            JsonNode coordinates = mapper.readTree(geoJson).get("coordinates");
            if (coordinates != null && coordinates.isArray()) {
                List<double[]> path = new ArrayList<>();
                for (JsonNode point : coordinates) {
                    // GeoJSON is [Lon, Lat], we store [Lat, Lon]
                    path.add(new double[]{point.get(1).asDouble(), point.get(0).asDouble()});
                }
                routePaths.put(routeName, path);
            }
        } catch (Exception e) {
            System.err.println("Invalid geometry for " + routeName + ": " + e.getMessage());
        }
    }

    public List<double[]> getPath(String routeName) { return routePaths.get(routeName); }
    public boolean hasRoute(String routeName) { return routePaths.containsKey(routeName); }
}