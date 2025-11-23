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

    public Optional<OsmRouteData> fetchRouteData(String relationId) {
        try {
            // Query: relation + members with explicit geometry
            String query = String.format("[out:json][timeout:60]; relation(%s); out geom;", relationId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("data", query);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    OVERPASS_API_URL, new HttpEntity<>(body, headers), String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return Optional.empty();
            }

            return parseOverpassResponse(response.getBody(), relationId);

        } catch (Exception e) {
            log.error("Failed to fetch relation {}: {}", relationId, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<OsmRouteData> parseOverpassResponse(String json, String relationId) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode elements = root.path("elements");
            JsonNode relation = null;

            for (JsonNode el : elements) {
                if ("relation".equals(el.path("type").asText()) && 
                    el.path("id").asLong() == Long.parseLong(relationId)) {
                    relation = el;
                    break;
                }
            }

            if (relation == null) return Optional.empty();

            OsmRouteData data = new OsmRouteData();
            data.setRelationId(relationId);
            data.setRef(relation.path("tags").path("ref").asText("Unknown"));
            data.setName(relation.path("tags").path("name").asText("Unnamed"));

            // 1. Use MultiLineString to render segments exactly as they are in OSM
            // This avoids "spider webs" caused by artificially connecting distant points
            data.setGeometryGeoJson(buildMultiLineGeometry(relation));

            // 2. Extract Stops
            data.setStops(extractStops(relation));

            return Optional.of(data);

        } catch (Exception e) {
            log.error("Error parsing OSM data: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Builds a GeoJSON MultiLineString.
     * Instead of stitching into one line, we return a collection of lines.
     * This prevents visual artifacts when data has gaps or is unordered.
     */
    private String buildMultiLineGeometry(JsonNode relation) throws Exception {
        List<List<double[]>> multiLineCoordinates = new ArrayList<>();
        JsonNode members = relation.path("members");

        if (members.isArray()) {
            for (JsonNode member : members) {
                // Only process ways (roads)
                if ("way".equals(member.path("type").asText()) && 
                    !member.path("role").asText().contains("platform") &&
                    !member.path("role").asText().contains("stop") &&
                    member.has("geometry")) {
                    
                    List<double[]> segment = new ArrayList<>();
                    for (JsonNode pt : member.path("geometry")) {
                        // GeoJSON format: [Longitude, Latitude]
                        segment.add(new double[]{pt.get("lon").asDouble(), pt.get("lat").asDouble()});
                    }

                    if (!segment.isEmpty()) {
                        multiLineCoordinates.add(segment);
                    }
                }
            }
        }

        if (multiLineCoordinates.isEmpty()) return "{}";

        Map<String, Object> geoJson = new HashMap<>();
        geoJson.put("type", "MultiLineString");
        geoJson.put("coordinates", multiLineCoordinates);

        return objectMapper.writeValueAsString(geoJson);
    }

    private List<OsmStopData> extractStops(JsonNode relation) {
        List<OsmStopData> stops = new ArrayList<>();
        JsonNode members = relation.path("members");
        int order = 0;

        if (members.isArray()) {
            for (JsonNode member : members) {
                String role = member.path("role").asText();
                if ("node".equals(member.path("type").asText()) && 
                   (role.contains("stop") || role.contains("platform"))) {
                    
                    // Check for geometry in the member directly (provided by "out geom")
                    if (member.has("lat") && member.has("lon")) {
                        OsmStopData stop = new OsmStopData();
                        stop.setNodeId(String.valueOf(member.path("ref").asLong()));
                        stop.setName(member.path("name").asText("Stop " + stop.getNodeId()));
                        stop.setLatitude(member.get("lat").asDouble());
                        stop.setLongitude(member.get("lon").asDouble());
                        stop.setOrder(++order);
                        stops.add(stop);
                    }
                }
            }
        }
        return stops;
    }
}