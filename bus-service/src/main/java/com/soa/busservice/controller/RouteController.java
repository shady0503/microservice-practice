package com.soa.busservice.controller;

import com.soa.busservice.model.Route;
import com.soa.busservice.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Route endpoints.
 */
@RestController
@RequestMapping("/routes")
@RequiredArgsConstructor
@Slf4j
public class RouteController {
    
    private final RouteRepository routeRepository;
    
    /**
     * Get all routes with their complete geometries.
     * GET /routes
     * 
     * @return List of all routes
     */
    @GetMapping
    public ResponseEntity<List<Route>> getAllRoutes() {
        log.info("GET /routes - Fetching all routes");
        List<Route> routes = routeRepository.findAll();
        log.info("Returning {} routes", routes.size());
        return ResponseEntity.ok(routes);
    }
    
    /**
     * Get a specific route by ID.
     * GET /routes/{routeId}
     * 
     * @param routeId Route identifier
     * @return Route details
     */
    @GetMapping("/{routeId}")
    public ResponseEntity<Route> getRouteById(@PathVariable UUID routeId) {
        log.info("GET /routes/{} - Fetching route", routeId);
        return routeRepository.findById(routeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
