package com.soa.busservice.simulation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.soa.busservice.event.RouteCreatedEvent;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RouteGeometryCache {
    private final Map<String, List<double[]>> routePaths = new ConcurrentHashMap<>();
    // Maps routeName -> { PathIndex -> StopName }
    private final Map<String, Map<Integer, String>> routeStops = new ConcurrentHashMap<>();
    // Maps lineRef (e.g. "30") -> List of routeNames (e.g. ["30: Aller", "30:
    // Retour"])
    private final Map<String, List<String>> lineToRoutesMap = new ConcurrentHashMap<>();

    private final ObjectMapper mapper = new ObjectMapper();

    public void cacheRoute(String routeName, String geoJson, List<RouteCreatedEvent.StopInfo> stopsInfo) {
        try {
            List<double[]> path = parseGeometry(geoJson);
            if (path.isEmpty())
                return;

            routePaths.put(routeName, path);

            // Map lineRef to routeName
            String lineRef = routeName.split(":")[0].trim();
            lineToRoutesMap.computeIfAbsent(lineRef, k -> new ArrayList<>()).add(routeName);

            Map<Integer, String> stopMapping = new HashMap<>();

            if (stopsInfo != null && !stopsInfo.isEmpty()) {
                // Map each provided stop to the closest point on the route path
                for (RouteCreatedEvent.StopInfo stop : stopsInfo) {
                    int closestIndex = findClosestPointIndex(path, stop.getLatitude(), stop.getLongitude());
                    if (closestIndex != -1) {
                        stopMapping.put(closestIndex, stop.getName());
                    }
                }
            } else {
                // Fallback: Generate fake stops if no data provided
                stopMapping.put(0, "Terminus Start");
                stopMapping.put(path.size() - 1, "Terminus End");
                for (int i = 20; i < path.size() - 20; i += 20) {
                    stopMapping.put(i, "Stop " + (i / 20));
                }
            }

            routeStops.put(routeName, stopMapping);

        } catch (Exception e) {
            System.err.println("Invalid geometry for " + routeName + ": " + e.getMessage());
        }
    }

    // Overload for legacy calls
    public void cacheRoute(String routeName, String geoJson) {
        cacheRoute(routeName, geoJson, null);
    }

    public List<double[]> getPath(String routeName) {
        return routePaths.get(routeName);
    }

    public String getAnyRouteName(String lineRef) {
        List<String> routes = lineToRoutesMap.get(lineRef);
        if (routes != null && !routes.isEmpty()) {
            // Return a random route to distribute buses across directions
            return routes.get(new Random().nextInt(routes.size()));
        }
        return null;
    }

    // Check if current index corresponds to a stop
    public boolean isStop(String routeName, int index) {
        return routeStops.containsKey(routeName) && routeStops.get(routeName).containsKey(index);
    }

    // Get the name of the stop at this index
    public String getStopName(String routeName, int index) {
        if (!routeStops.containsKey(routeName))
            return null;
        return routeStops.get(routeName).get(index);
    }

    private int findClosestPointIndex(List<double[]> path, double lat, double lon) {
        int closestIndex = -1;
        double minDistance = Double.MAX_VALUE;

        for (int i = 0; i < path.size(); i++) {
            double[] point = path.get(i);
            double dist = Math.pow(point[0] - lat, 2) + Math.pow(point[1] - lon, 2);
            if (dist < minDistance) {
                minDistance = dist;
                closestIndex = i;
            }
        }
        return closestIndex; // Only simple Euclidean match needed for snapping
    }

    private List<double[]> parseGeometry(String geoJson) throws Exception {
        JsonNode root = mapper.readTree(geoJson);
        List<double[]> path = new ArrayList<>();
        if (root.has("coordinates")) {
            JsonNode coordinates = root.get("coordinates");
            if ("MultiLineString".equalsIgnoreCase(root.path("type").asText())) {
                for (JsonNode segment : coordinates) {
                    for (JsonNode point : segment) {
                        path.add(new double[] { point.get(1).asDouble(), point.get(0).asDouble() });
                    }
                }
            } else {
                for (JsonNode point : coordinates) {
                    path.add(new double[] { point.get(1).asDouble(), point.get(0).asDouble() });
                }
            }
        }
        return path;
    }
}