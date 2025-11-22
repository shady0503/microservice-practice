package com.trajets.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trajets.dto.overpass.Element;
import com.trajets.dto.overpass.Geometry;
import com.trajets.dto.overpass.Member;
import com.trajets.dto.overpass.OverpassResponse;
import com.trajets.dto.request.RouteGeometryImportRequest;
import com.trajets.model.*;
import com.trajets.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BusRouteImportService {

    private final OverpassApiService overpassApiService;
    private final LigneRepository ligneRepository;
    private final ArretRepository arretRepository;
    private final TrajetRepository trajetRepository;
    private final TrajetArretRepository trajetArretRepository;
    private final ObjectMapper objectMapper;

    public BusRouteImportService(
            OverpassApiService overpassApiService,
            LigneRepository ligneRepository,
            ArretRepository arretRepository,
            TrajetRepository trajetRepository,
            TrajetArretRepository trajetArretRepository,
            ObjectMapper objectMapper) {
        this.overpassApiService = overpassApiService;
        this.ligneRepository = ligneRepository;
        this.arretRepository = arretRepository;
        this.trajetRepository = trajetRepository;
        this.trajetArretRepository = trajetArretRepository;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> importAllBusRoutes() {
        log.info("Starting import of bus routes...");

        try {
            OverpassResponse idsResponse = overpassApiService.fetchBusRouteIds();

            if (idsResponse.getElements() == null || idsResponse.getElements().isEmpty()) {
                return Map.of("success", false, "message", "No routes found",
                        "linesImported", 0, "stopsImported", 0, "trajetsImported", 0);
            }

            List<Long> routeIds = idsResponse.getElements().stream()
                    .map(Element::getId)
                    .collect(Collectors.toList());

            log.info("Found {} routes", routeIds.size());

            ExecutorService executor = Executors.newFixedThreadPool(3);
            CountDownLatch latch = new CountDownLatch(routeIds.size());

            AtomicInteger lines = new AtomicInteger(0);
            AtomicInteger stops = new AtomicInteger(0);
            AtomicInteger trajets = new AtomicInteger(0);

            for (Long routeId : routeIds) {
                executor.submit(() -> {
                    try {
                        Thread.sleep(200);
                        Map<String, Integer> result = importSingleRoute(routeId);
                        lines.addAndGet(result.get("lines"));
                        stops.addAndGet(result.get("stops"));
                        trajets.addAndGet(result.get("trajets"));
                    } catch (Exception e) {
                        log.error("Error importing route {}: {}", routeId, e.getMessage());
                    } finally {
                        latch.countDown();
                        log.info("Progress: {}/{}", routeIds.size() - latch.getCount(), routeIds.size());
                    }
                });
            }

            latch.await(10, TimeUnit.MINUTES);
            executor.shutdown();

            log.info("Import completed: {} lines, {} stops, {} trajets",
                    lines.get(), stops.get(), trajets.get());

            return Map.of("success", true, "linesImported", lines.get(),
                    "stopsImported", stops.get(), "trajetsImported", trajets.get());

        } catch (Exception e) {
            log.error("Import failed", e);
            throw new RuntimeException("Import failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Map<String, Integer> importSingleRoute(Long routeId) {
        try {
            OverpassResponse response = overpassApiService.fetchBusRouteById(routeId);

            if (response.getElements() == null || response.getElements().isEmpty()) {
                return Map.of("lines", 0, "stops", 0, "trajets", 0);
            }

            Map<String, Element> elementMap = response.getElements().stream()
                    .collect(Collectors.toMap(e -> e.getType() + e.getId(), e -> e));

            Element relation = response.getElements().stream()
                    .filter(e -> "relation".equals(e.getType()))
                    .findFirst()
                    .orElse(null);

            if (relation == null) {
                return Map.of("lines", 0, "stops", 0, "trajets", 0);
            }

            int stopCount = 0;
            Ligne ligne = createOrUpdateLigne(relation, elementMap);
            if (ligne != null) {
                Trajet trajet = createTrajet(relation, ligne);
                if (trajet != null) {
                    List<Element> stopNodes = extractStopNodes(relation, elementMap);
                    for (int i = 0; i < stopNodes.size(); i++) {
                        Arret arret = createOrUpdateArret(stopNodes.get(i));
                        if (arret != null) {
                            stopCount++;
                            linkArretToTrajet(trajet, arret, i);
                        }
                    }
                    return Map.of("lines", 1, "stops", stopCount, "trajets", 1);
                }
                return Map.of("lines", 1, "stops", 0, "trajets", 0);
            }

            return Map.of("lines", 0, "stops", 0, "trajets", 0);

        } catch (Exception e) {
            log.error("Error importing route {}", routeId, e);
            return Map.of("lines", 0, "stops", 0, "trajets", 0);
        }
    }

    private Ligne createOrUpdateLigne(Element relation, Map<String, Element> elementMap) {
        Map<String, String> tags = relation.getTags();
        if (tags == null)
            return null;

        String code = tags.getOrDefault("ref", "L" + relation.getId());
        String nom = tags.getOrDefault("name", tags.getOrDefault("ref", "Line " + relation.getId()));

        Optional<Ligne> existingLigne = ligneRepository.findByCode(code);
        Ligne ligne = existingLigne.orElse(new Ligne());

        ligne.setCode(code);
        ligne.setNom(nom);
        ligne.setDescription(tags.getOrDefault("description", tags.getOrDefault("operator", "")));

        String routeGeometry = buildRouteGeometry(relation, elementMap);
        if (routeGeometry != null) {
            ligne.setRouteGeometry(routeGeometry);
        }

        return ligneRepository.save(ligne);
    }

    // IMPROVED ROUTE GEOMETRY METHODS FOR BusRouteImportService.java
    // Replace the buildRouteGeometry method and add these helper methods

    private String buildRouteGeometry(Element relation, Map<String, Element> elementMap) {
        if (relation.getMembers() == null)
            return null;

        // Collect way members with forward/empty roles only (skip backward/return)
        List<Element> routeWays = new ArrayList<>();
        for (Member member : relation.getMembers()) {
            if ("way".equals(member.getType())) {
                String role = member.getRole() != null ? member.getRole().toLowerCase() : "";

                // Only include forward direction or empty role ways
                // Skip: backward, return, or any other directional indicators
                if (role.contains("backward") || role.contains("return") ||
                        role.contains("reverse") || role.contains("back")) {
                    continue;
                }

                Element way = elementMap.get("way" + member.getRef());
                if (way != null && way.getGeometry() != null && !way.getGeometry().isEmpty()) {
                    routeWays.add(way);
                }
            }
        }

        if (routeWays.isEmpty()) {
            log.warn("No valid ways found for route {}", relation.getId());
            return null;
        }

        // Build ordered and connected coordinate list
        List<double[]> coordinates = buildConnectedPath(routeWays);

        if (coordinates.isEmpty() || coordinates.size() < 2) {
            log.warn("Insufficient coordinates for route {}", relation.getId());
            return null;
        }

        // Remove consecutive duplicates
        coordinates = removeDuplicates(coordinates);

        if (coordinates.size() < 2)
            return null;

        try {
            Map<String, Object> geoJson = new HashMap<>();
            geoJson.put("type", "LineString");
            geoJson.put("coordinates", coordinates);
            return objectMapper.writeValueAsString(geoJson);
        } catch (JsonProcessingException e) {
            log.error("Error creating GeoJSON for route {}", relation.getId(), e);
            return null;
        }
    }

    /**
     * Build a connected path from a list of ways by properly ordering and reversing
     * them
     */
    private List<double[]> buildConnectedPath(List<Element> ways) {
        if (ways.isEmpty())
            return new ArrayList<>();

        List<double[]> result = new ArrayList<>();
        List<Element> remainingWays = new ArrayList<>(ways);

        // Start with the first way
        Element currentWay = remainingWays.remove(0);
        List<double[]> currentCoords = extractCoordinates(currentWay);
        result.addAll(currentCoords);

        double[] lastPoint = currentCoords.get(currentCoords.size() - 1);

        // Try to connect remaining ways
        int maxIterations = remainingWays.size() * 2; // Prevent infinite loops
        int iterations = 0;

        while (!remainingWays.isEmpty() && iterations < maxIterations) {
            iterations++;
            boolean foundConnection = false;

            for (int i = 0; i < remainingWays.size(); i++) {
                Element way = remainingWays.get(i);
                List<double[]> wayCoords = extractCoordinates(way);

                if (wayCoords.isEmpty()) {
                    remainingWays.remove(i);
                    i--;
                    continue;
                }

                double[] wayStart = wayCoords.get(0);
                double[] wayEnd = wayCoords.get(wayCoords.size() - 1);

                double distToStart = distance(lastPoint, wayStart);
                double distToEnd = distance(lastPoint, wayEnd);

                // Connection threshold: ~100 meters (approximately 0.001 degrees)
                double threshold = 0.001;

                if (distToStart < threshold) {
                    // Way connects in forward direction
                    result.addAll(wayCoords.subList(1, wayCoords.size())); // Skip first point (duplicate)
                    lastPoint = wayEnd;
                    remainingWays.remove(i);
                    foundConnection = true;
                    break;
                } else if (distToEnd < threshold) {
                    // Way connects in reverse direction
                    List<double[]> reversed = new ArrayList<>(wayCoords);
                    Collections.reverse(reversed);
                    result.addAll(reversed.subList(1, reversed.size())); // Skip first point (duplicate)
                    lastPoint = wayStart;
                    remainingWays.remove(i);
                    foundConnection = true;
                    break;
                }
            }

            // If no connection found in this pass, break to avoid infinite loop
            if (!foundConnection) {
                if (!remainingWays.isEmpty()) {
                    log.debug("Could not connect {} remaining ways - route may be discontinuous",
                            remainingWays.size());
                }
                break;
            }
        }

        return result;
    }

    /**
     * Extract coordinates from a way element
     */
    private List<double[]> extractCoordinates(Element way) {
        List<double[]> coords = new ArrayList<>();
        if (way.getGeometry() != null) {
            for (Geometry geom : way.getGeometry()) {
                if (geom.getLon() != null && geom.getLat() != null) {
                    coords.add(new double[] { geom.getLon(), geom.getLat() });
                }
            }
        }
        return coords;
    }

    /**
     * Calculate distance between two coordinates (simple Euclidean distance)
     * Good enough for short distances like connecting way endpoints
     */
    private double distance(double[] p1, double[] p2) {
        double dx = p1[0] - p2[0];
        double dy = p1[1] - p2[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    private List<double[]> removeDuplicates(List<double[]> coordinates) {
        if (coordinates.isEmpty())
            return coordinates;

        List<double[]> result = new ArrayList<>();
        double[] previous = null;

        for (double[] coord : coordinates) {
            // Only remove exact consecutive duplicates
            if (previous == null ||
                    Math.abs(coord[0] - previous[0]) > 0.0000001 ||
                    Math.abs(coord[1] - previous[1]) > 0.0000001) {
                result.add(coord);
                previous = coord;
            }
        }

        return result;
    }

    private Trajet createTrajet(Element relation, Ligne ligne) {
        Map<String, String> tags = relation.getTags();
        if (tags == null)
            return null;

        String nom = tags.getOrDefault("name", ligne.getNom());

        Optional<Trajet> existingTrajet = trajetRepository.findByNomAndLigne(nom, ligne);
        if (existingTrajet.isPresent()) {
            return existingTrajet.get();
        }

        Trajet trajet = new Trajet();
        trajet.setNom(nom);
        trajet.setLigne(ligne);

        return trajetRepository.save(trajet);
    }

    private List<Element> extractStopNodes(Element relation, Map<String, Element> elementMap) {
        if (relation.getMembers() == null)
            return Collections.emptyList();

        return relation.getMembers().stream()
                .filter(m -> "node".equals(m.getType()))
                .filter(m -> "stop".equals(m.getRole()) || "platform".equals(m.getRole()))
                .map(m -> elementMap.get("node" + m.getRef()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private Arret createOrUpdateArret(Element node) {
        if (node.getLat() == null || node.getLon() == null)
            return null;

        Optional<Arret> existing = arretRepository.findByLatitudeAndLongitude(node.getLat(), node.getLon());
        if (existing.isPresent()) {
            return existing.get();
        }

        Map<String, String> tags = node.getTags();
        String nom = tags != null ? tags.getOrDefault("name", "Stop " + node.getId()) : "Stop " + node.getId();
        String address = tags != null ? tags.getOrDefault("addr:full", tags.getOrDefault("addr:street", "")) : "";

        Arret arret = new Arret();
        arret.setNom(nom);
        arret.setLatitude(node.getLat());
        arret.setLongitude(node.getLon());
        arret.setAddress(address);

        return arretRepository.save(arret);
    }

    private void linkArretToTrajet(Trajet trajet, Arret arret, int ordre) {
        if (trajetArretRepository.existsByTrajetAndArret(trajet, arret)) {
            return;
        }

        TrajetArret trajetArret = new TrajetArret();
        trajetArret.setTrajet(trajet);
        trajetArret.setArret(arret);
        trajetArret.setOrdre(ordre);

        trajetArretRepository.save(trajetArret);
    }

    /**
     * Import routes from pre-processed GeoJSON (via osmtogeojson on frontend)
     * This avoids geometry processing issues and overlapping routes
     */
    @Transactional
    public Map<String, Object> importGeoJsonRoutes(RouteGeometryImportRequest request) {
        log.info("Starting import of {} GeoJSON routes from frontend", request.getRoutes().size());

        int linesImported = 0;
        int stopsImported = 0;
        int trajetsImported = 0;

        try {
            for (RouteGeometryImportRequest.RouteData routeData : request.getRoutes()) {
                try {
                    // Create or update Ligne
                    Ligne ligne = ligneRepository.findByCode(routeData.getRef())
                            .orElse(new Ligne());

                    ligne.setCode(routeData.getRef());
                    ligne.setNom(routeData.getName() != null ? routeData.getName() : routeData.getRef());
                    ligne.setDescription(String.format("%s → %s",
                            routeData.getFrom() != null ? routeData.getFrom() : "Unknown",
                            routeData.getTo() != null ? routeData.getTo() : "Unknown"));

                    // Convert geometry map to JSON string
                    if (routeData.getGeometry() != null) {
                        String geometryJson = objectMapper.writeValueAsString(routeData.getGeometry());
                        ligne.setRouteGeometry(geometryJson);
                    }

                    ligne = ligneRepository.save(ligne);
                    linesImported++;

                    // Create Trajet
                    Trajet trajet = new Trajet();
                    trajet.setLigne(ligne);
                    trajet.setNom(routeData.getFrom() + " → " + routeData.getTo());
                    trajet = trajetRepository.save(trajet);
                    trajetsImported++;

                    // Process stops
                    if (routeData.getStops() != null) {
                        int ordre = 1;
                        for (RouteGeometryImportRequest.StopData stopData : routeData.getStops()) {
                            if (stopData.getLatitude() != null && stopData.getLongitude() != null) {
                                Arret arret = createOrUpdateArretFromGeoJson(stopData);
                                stopsImported++;

                                // Link stop to trajet
                                TrajetArret trajetArret = new TrajetArret();
                                trajetArret.setTrajet(trajet);
                                trajetArret.setArret(arret);
                                trajetArret.setOrdre(ordre++);
                                trajetArretRepository.save(trajetArret);
                            }
                        }
                    }

                    log.info("Imported route: {} ({} stops)", routeData.getRef(),
                            routeData.getStops() != null ? routeData.getStops().size() : 0);

                } catch (Exception e) {
                    log.error("Failed to import route {}: {}", routeData.getRef(), e.getMessage());
                }
            }

            log.info("GeoJSON import completed: {} lines, {} stops, {} trajets",
                    linesImported, stopsImported, trajetsImported);

            return Map.of(
                    "success", true,
                    "linesImported", linesImported,
                    "stopsImported", stopsImported,
                    "trajetsImported", trajetsImported);

        } catch (Exception e) {
            log.error("Error during GeoJSON import", e);
            return Map.of(
                    "success", false,
                    "message", e.getMessage());
        }
    }

    private Arret createOrUpdateArretFromGeoJson(RouteGeometryImportRequest.StopData stopData) {
        // Try to find existing stop by coordinates (within ~10 meters)
        List<Arret> nearbyStops = arretRepository.findAll().stream()
                .filter(a -> a.getLatitude() != null && a.getLongitude() != null)
                .filter(a -> Math.abs(a.getLatitude() - stopData.getLatitude()) < 0.0001
                        && Math.abs(a.getLongitude() - stopData.getLongitude()) < 0.0001)
                .collect(Collectors.toList());

        if (!nearbyStops.isEmpty()) {
            return nearbyStops.get(0);
        }

        // Create new stop
        Arret arret = new Arret();
        arret.setNom(stopData.getName() != null ? stopData.getName() : "Stop " + stopData.getNodeId());
        arret.setLatitude(stopData.getLatitude());
        arret.setLongitude(stopData.getLongitude());

        return arretRepository.save(arret);
    }
}
