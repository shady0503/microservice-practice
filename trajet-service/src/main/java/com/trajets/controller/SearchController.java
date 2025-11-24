package com.trajets.controller;

import com.trajets.model.Line;
import com.trajets.model.Route;
import com.trajets.model.RouteStop;
import com.trajets.model.Stop;
import com.trajets.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SearchController {

    private final LineRepository lineRepository;
    private final RouteRepository routeRepository;
    private final RouteStopRepository routeStopRepository;
    private final StopRepository stopRepository;

    /**
     * GET /api/search - Search for bus lines based on origin and destination coordinates
     *
     * @param fromLat Origin latitude
     * @param fromLon Origin longitude
     * @param toLat Destination latitude
     * @param toLon Destination longitude
     * @param date Optional travel date (not currently used in filtering)
     * @return List of matching lines with route information
     */
    @GetMapping("/search")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> searchRoutes(
            @RequestParam Double fromLat,
            @RequestParam Double fromLon,
            @RequestParam Double toLat,
            @RequestParam Double toLon,
            @RequestParam(required = false) String date
    ) {
        // Get all lines
        List<Line> allLines = lineRepository.findAll();

        // Search radius in degrees (approximately 1km = 0.009 degrees)
        double searchRadius = 0.015; // ~1.5km radius

        List<Map<String, Object>> results = new ArrayList<>();

        for (Line line : allLines) {
            // Get all routes for this line
            List<Route> routes = routeRepository.findByLineId(line.getId());

            for (Route route : routes) {
                // Get all stops for this route
                List<RouteStop> routeStops = routeStopRepository
                        .findByRouteIdOrderByStopOrder(route.getId());

                if (routeStops.isEmpty()) continue;

                // Check if any stop is near the origin
                boolean hasOriginStop = false;
                Stop nearestOriginStop = null;
                double minOriginDistance = Double.MAX_VALUE;

                for (RouteStop rs : routeStops) {
                    Stop stop = rs.getStop();
                    double distance = calculateDistance(fromLat, fromLon,
                                                       stop.getLatitude(), stop.getLongitude());
                    if (distance < searchRadius && distance < minOriginDistance) {
                        hasOriginStop = true;
                        nearestOriginStop = stop;
                        minOriginDistance = distance;
                    }
                }

                if (!hasOriginStop) continue;

                // Check if any stop (after origin) is near the destination
                boolean hasDestinationStop = false;
                Stop nearestDestStop = null;
                double minDestDistance = Double.MAX_VALUE;
                boolean passedOrigin = false;

                for (RouteStop rs : routeStops) {
                    Stop stop = rs.getStop();

                    // Mark when we've passed the origin stop
                    if (nearestOriginStop != null &&
                        stop.getId().equals(nearestOriginStop.getId())) {
                        passedOrigin = true;
                        continue;
                    }

                    // Only check destination stops after origin
                    if (passedOrigin) {
                        double distance = calculateDistance(toLat, toLon,
                                                           stop.getLatitude(), stop.getLongitude());
                        if (distance < searchRadius && distance < minDestDistance) {
                            hasDestinationStop = true;
                            nearestDestStop = stop;
                            minDestDistance = distance;
                        }
                    }
                }

                // If we found both origin and destination on this route, add it to results
                if (hasOriginStop && hasDestinationStop) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("line", line.getRef());
                    result.put("lineRef", line.getRef());
                    result.put("lineName", line.getName() != null ? line.getName() : "Line " + line.getRef());
                    result.put("routeId", route.getId());
                    result.put("direction", route.getDirection());

                    // Calculate approximate duration (minutes) based on number of stops
                    int originIndex = -1;
                    int destIndex = -1;
                    for (int i = 0; i < routeStops.size(); i++) {
                        if (routeStops.get(i).getStop().getId().equals(nearestOriginStop.getId())) {
                            originIndex = i;
                        }
                        if (routeStops.get(i).getStop().getId().equals(nearestDestStop.getId())) {
                            destIndex = i;
                        }
                    }

                    int stopsCount = destIndex - originIndex;
                    int estimatedMinutes = stopsCount * 3; // Assume 3 minutes per stop
                    result.put("duration", estimatedMinutes + " min");
                    result.put("estimatedDuration", estimatedMinutes + " minutes");

                    // Fixed price for now (can be made dynamic based on distance/stops)
                    double basePrice = 6.0; // Base price in MAD
                    double pricePerStop = 0.5;
                    double totalPrice = basePrice + (stopsCount * pricePerStop);
                    result.put("price", Math.round(totalPrice * 100.0) / 100.0);
                    result.put("fare", Math.round(totalPrice * 100.0) / 100.0);

                    result.put("stops", stopsCount);
                    result.put("originStop", nearestOriginStop.getName());
                    result.put("destinationStop", nearestDestStop.getName());

                    // Estimate next departure (mock data - would come from real-time system)
                    result.put("nextDeparture", "5-10 min");

                    results.add(result);

                    // Only add one route per line (avoid duplicates)
                    break;
                }
            }
        }

        // Sort by price (cheapest first)
        results.sort(Comparator.comparingDouble(r -> (Double) r.get("price")));

        return ResponseEntity.ok(results);
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in degrees (approximate)
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Simple Euclidean distance for small distances
        // For production, use proper Haversine formula
        double latDiff = lat2 - lat1;
        double lonDiff = lon2 - lon1;
        return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
    }
}
