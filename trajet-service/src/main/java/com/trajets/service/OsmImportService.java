// src/main/java/com/trajets/service/OsmImportService.java
package com.trajets.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trajets.dto.OsmRouteData;
import com.trajets.dto.OsmStopData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OsmImportService {

    private static final String OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Fetch and parse OSM data for a relation ID using Overpass API
     */
    public Optional<OsmRouteData> fetchRouteData(String relationId) {
        try {
            log.debug("    Fetching OSM data for relation: {}", relationId);

            // Build Overpass query
            String query = String.format(
                    "[out:json][timeout:60];\n" +
                            "relation(%s);\n" +
                            "(._;>;);\n" +
                            "out geom;",
                    relationId);

            // Send POST request (Overpass API prefers POST for queries)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("data", query);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    OVERPASS_API_URL, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.warn("    HTTP {} for relation: {}", response.getStatusCode(), relationId);
                return Optional.empty();
            }

            String jsonData = response.getBody();

            if (jsonData == null || jsonData.trim().isEmpty()) {
                log.warn("    Empty response for relation: {}", relationId);
                return Optional.empty();
            }

            // Parse JSON response
            OsmRouteData routeData = parseOverpassJson(jsonData, relationId);
            log.debug("    Successfully parsed relation: {}", relationId);

            return Optional.of(routeData);

        } catch (Exception e) {
            log.debug("    Failed to fetch relation {}: {}", relationId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Parse Overpass JSON response
     */
    private OsmRouteData parseOverpassJson(String jsonData, String relationId) throws Exception {
        JsonNode root = objectMapper.readTree(jsonData);
        JsonNode elements = root.get("elements");

        if (elements == null || !elements.isArray() || elements.size() == 0) {
            throw new IllegalStateException("No elements found in response");
        }

        // Index all nodes and ways
        Map<Long, JsonNode> nodeMap = new HashMap<>();
        Map<Long, JsonNode> wayMap = new HashMap<>();
        JsonNode relation = null;

        for (JsonNode element : elements) {
            String type = element.get("type").asText();
            long id = element.get("id").asLong();

            switch (type) {
                case "node":
                    nodeMap.put(id, element);
                    break;
                case "way":
                    wayMap.put(id, element);
                    break;
                case "relation":
                    relation = element;
                    break;
            }
        }

        if (relation == null) {
            throw new IllegalStateException("No relation found in response");
        }

        OsmRouteData routeData = new OsmRouteData();
        routeData.setRelationId(relationId);

        // Extract tags
        Map<String, String> tags = extractTags(relation);
        routeData.setRef(tags.getOrDefault("ref", "Unknown"));
        routeData.setName(tags.getOrDefault("name", tags.getOrDefault("ref", "Unnamed")));
        routeData.setDirection(determineDirection(tags));

        // Extract stops
        List<OsmStopData> stops = extractStops(relation, nodeMap);
        routeData.setStops(stops);

        // Extract geometry
        String geometry = extractGeometry(relation, wayMap, nodeMap);
        routeData.setGeometryGeoJson(geometry);

        return routeData;
    }

    /**
     * Extract tags from element
     */
    private Map<String, String> extractTags(JsonNode element) {
        Map<String, String> tags = new HashMap<>();

        JsonNode tagsNode = element.get("tags");
        if (tagsNode != null && tagsNode.isObject()) {
            tagsNode.fields().forEachRemaining(entry -> tags.put(entry.getKey(), entry.getValue().asText()));
        }

        return tags;
    }

    /**
     * Determine direction from tags
     */
    private String determineDirection(Map<String, String> tags) {
        String role = tags.getOrDefault("role", "");
        String direction = tags.getOrDefault("direction", "");

        if (role.contains("backward") || role.contains("return") || direction.contains("backward")) {
            return "RETURN";
        } else if (tags.containsKey("roundtrip") || "circular".equals(tags.get("route"))) {
            return "CIRCULAR";
        }

        return "GOING";
    }

    /**
     * Extract stops from relation
     */
    private List<OsmStopData> extractStops(JsonNode relation, Map<Long, JsonNode> nodeMap) {
        List<OsmStopData> stops = new ArrayList<>();

        JsonNode members = relation.get("members");
        if (members == null || !members.isArray()) {
            return stops;
        }

        int order = 1;
        for (JsonNode member : members) {
            String type = member.get("type").asText();
            String role = member.has("role") ? member.get("role").asText() : "";
            long ref = member.get("ref").asLong();

            if ("node".equals(type) && ("stop".equals(role) || "platform".equals(role))) {
                JsonNode node = nodeMap.get(ref);
                if (node != null && node.has("lat") && node.has("lon")) {
                    Map<String, String> tags = extractTags(node);

                    OsmStopData stop = new OsmStopData();
                    stop.setNodeId(String.valueOf(ref));
                    stop.setName(tags.getOrDefault("name", "Stop " + ref));
                    stop.setLatitude(node.get("lat").asDouble());
                    stop.setLongitude(node.get("lon").asDouble());
                    stop.setOrder(order++);

                    stops.add(stop);
                }
            }
        }

        return stops;
    }

    /**
     * Extract geometry from relation
     */
    /**
     * Extract and properly order geometry from relation
     * Connects ways end-to-end to form a continuous path
     */
    private String extractGeometry(JsonNode relation, Map<Long, JsonNode> wayMap,
            Map<Long, JsonNode> nodeMap) throws Exception {

        JsonNode members = relation.get("members");
        if (members == null || !members.isArray()) {
            return "{}";
        }

        // Collect way members (skip backward/return roles)
        List<JsonNode> routeWays = new ArrayList<>();
        for (JsonNode member : members) {
            String type = member.get("type").asText();
            String role = member.has("role") ? member.get("role").asText() : "";
            long ref = member.get("ref").asLong();

            if ("way".equals(type)) {
                if (role.contains("backward") || role.contains("return")) {
                    continue;
                }

                JsonNode way = wayMap.get(ref);
                if (way != null) {
                    routeWays.add(way);
                }
            }
        }

        if (routeWays.isEmpty()) {
            return "{}";
        }

        // Build connected path
        List<double[]> coordinates = buildConnectedPath(routeWays);

        if (coordinates.isEmpty() || coordinates.size() < 2) {
            return "{}";
        }

        // Remove consecutive duplicates
        List<double[]> cleaned = removeDuplicates(coordinates);

        if (cleaned.size() < 2) {
            return "{}";
        }

        // Create GeoJSON LineString
        Map<String, Object> geoJson = new HashMap<>();
        geoJson.put("type", "LineString");
        geoJson.put("coordinates", cleaned);

        return objectMapper.writeValueAsString(geoJson);
    }

    /**
     * Build a connected path from ways by ordering them geographically
     */
    private List<double[]> buildConnectedPath(List<JsonNode> ways) {
        if (ways.isEmpty()) {
            return new ArrayList<>();
        }

        List<double[]> result = new ArrayList<>();
        List<JsonNode> remainingWays = new ArrayList<>(ways);

        // Start with the first way
        JsonNode currentWay = remainingWays.remove(0);
        List<double[]> currentCoords = extractCoordinatesFromWay(currentWay);

        if (currentCoords.isEmpty()) {
            return result;
        }

        result.addAll(currentCoords);
        double[] lastPoint = currentCoords.get(currentCoords.size() - 1);

        // Try to connect remaining ways
        int maxIterations = remainingWays.size() * 2;
        int iterations = 0;

        while (!remainingWays.isEmpty() && iterations < maxIterations) {
            iterations++;
            boolean foundConnection = false;

            for (int i = 0; i < remainingWays.size(); i++) {
                JsonNode way = remainingWays.get(i);
                List<double[]> wayCoords = extractCoordinatesFromWay(way);

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

            // If no connection found, try to start a new segment or give up
            if (!foundConnection) {
                if (!remainingWays.isEmpty()) {
                    log.debug("Could not connect {} remaining ways - route may be discontinuous",
                            remainingWays.size());

                    // Try starting fresh with next way (for multi-segment routes)
                    if (remainingWays.size() > 1) {
                        JsonNode nextWay = remainingWays.remove(0);
                        List<double[]> nextCoords = extractCoordinatesFromWay(nextWay);
                        if (!nextCoords.isEmpty()) {
                            result.addAll(nextCoords);
                            lastPoint = nextCoords.get(nextCoords.size() - 1);
                            foundConnection = true;
                        }
                    }
                }

                if (!foundConnection) {
                    break; // Give up
                }
            }
        }

        return result;
    }

    /**
     * Extract coordinates from a way (handles both geometry and nodes formats)
     */
    private List<double[]> extractCoordinatesFromWay(JsonNode way) {
        List<double[]> coords = new ArrayList<>();

        // Try geometry first (from "out geom")
        JsonNode geometry = way.get("geometry");
        if (geometry != null && geometry.isArray()) {
            for (JsonNode point : geometry) {
                if (point.has("lat") && point.has("lon")) {
                    double lat = point.get("lat").asDouble();
                    double lon = point.get("lon").asDouble();
                    coords.add(new double[] { lon, lat });
                }
            }
            return coords;
        }

        // Fallback to nodes (shouldn't happen with "out geom" but just in case)
        JsonNode nodes = way.get("nodes");
        if (nodes != null && nodes.isArray()) {
            for (JsonNode nodeId : nodes) {
                // Note: Without "out geom", we'd need to look up nodes
                // For now, just skip this case as we always use "out geom"
            }
        }

        return coords;
    }

    /**
     * Calculate distance between two coordinates (simple Euclidean)
     */
    private double distance(double[] p1, double[] p2) {
        double dx = p1[0] - p2[0];
        double dy = p1[1] - p2[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Remove consecutive duplicate coordinates
     */
    private List<double[]> removeDuplicates(List<double[]> coordinates) {
        if (coordinates.isEmpty()) {
            return coordinates;
        }

        List<double[]> result = new ArrayList<>();
        double[] previous = null;

        for (double[] coord : coordinates) {
            if (previous == null ||
                    Math.abs(coord[0] - previous[0]) > 0.0000001 ||
                    Math.abs(coord[1] - previous[1]) > 0.0000001) {
                result.add(coord);
                previous = coord;
            }
        }

        return result;
    }
}