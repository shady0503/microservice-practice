// src/main/java/com/trajets/controller/LineController.java
package com.trajets.controller;

import com.trajets.model.Line;
import com.trajets.model.Route;
import com.trajets.model.RouteStop;
import com.trajets.model.Stop;
import com.trajets.repository.*;
import com.trajets.service.LineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lines")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LineController {

    private final LineService lineService;
    private final LineRepository lineRepository;
    private final RouteRepository routeRepository;
    private final RouteStopRepository routeStopRepository;
    private final StopRepository stopRepository;

    /**
     * GET /api/lines - Get all lines
     */
    @GetMapping
    public List<Line> getAllLines() {
        return lineService.getAllLines();
    }

    /**
     * GET /api/lines/{ref} - Get line by ref (e.g., "32H")
     */
    @GetMapping("/{ref}")
    public ResponseEntity<Line> getLineByRef(@PathVariable String ref) {
        return lineService.getLineByRef(ref)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/lines/{ref}/routes - Get all routes for a line
     * Returns both GOING and RETURN directions
     */
    @GetMapping("/{ref}/routes")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Route>> getRoutesByLineRef(@PathVariable String ref) {
        return lineService.getLineByRef(ref)
                .map(line -> {
                    List<Route> routes = routeRepository.findByLineId(line.getId());
                    return ResponseEntity.ok(routes);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/routes/{routeId} - Get specific route details
     */
    @GetMapping("/routes/{routeId}")
    @Transactional(readOnly = true)
    public ResponseEntity<Route> getRoute(@PathVariable Long routeId) {
        return routeRepository.findById(routeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/routes/{routeId}/stops - Get ordered stops for a route
     */
    @GetMapping("/routes/{routeId}/stops")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getStopsByRoute(@PathVariable Long routeId) {
        if (!routeRepository.existsById(routeId)) {
            return ResponseEntity.notFound().build();
        }

        List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrder(routeId);

        List<Map<String, Object>> result = routeStops.stream()
                .map(rs -> {
                    Stop stop = rs.getStop();
                    Map<String, Object> stopInfo = new HashMap<>();
                    stopInfo.put("id", stop.getId());
                    stopInfo.put("name", stop.getName());
                    stopInfo.put("latitude", stop.getLatitude());
                    stopInfo.put("longitude", stop.getLongitude());
                    stopInfo.put("address", stop.getAddress());
                    stopInfo.put("order", rs.getStopOrder());
                    return stopInfo;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/lines/{ref}/complete - Get complete line info with all routes and
     * stops
     */
    @GetMapping("/{ref}/complete")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getCompleteLineInfo(@PathVariable String ref) {
        return lineService.getLineByRef(ref)
                .map(line -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("line", line);

                    List<Route> routes = routeRepository.findByLineId(line.getId());

                    List<Map<String, Object>> routesWithStops = routes.stream()
                            .map(route -> {
                                Map<String, Object> routeInfo = new HashMap<>();
                                routeInfo.put("id", route.getId());
                                routeInfo.put("name", route.getName());
                                routeInfo.put("direction", route.getDirection());
                                routeInfo.put("geometry", route.getGeometry());

                                List<RouteStop> stops = routeStopRepository
                                        .findByRouteIdOrderByStopOrder(route.getId());

                                List<Map<String, Object>> stopList = stops.stream()
                                        .map(rs -> {
                                            Stop stop = rs.getStop();
                                            Map<String, Object> stopInfo = new HashMap<>();
                                            stopInfo.put("id", stop.getId());
                                            stopInfo.put("name", stop.getName());
                                            stopInfo.put("latitude", stop.getLatitude());
                                            stopInfo.put("longitude", stop.getLongitude());
                                            stopInfo.put("order", rs.getStopOrder());
                                            return stopInfo;
                                        })
                                        .collect(Collectors.toList());

                                routeInfo.put("stops", stopList);
                                return routeInfo;
                            })
                            .collect(Collectors.toList());

                    result.put("routes", routesWithStops);
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}