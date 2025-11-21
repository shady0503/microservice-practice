package com.trajets.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trajets.dto.overpass.OverpassResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class OverpassApiService {

    private static final String OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OverpassApiService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public OverpassResponse fetchBusRouteIds() {
        String query = "[out:json][timeout:30];" +
            "relation[\"route\"=\"bus\"](33.85,-7.0,34.15,-6.7);" +
            "out ids;";

        try {
            log.info("Fetching bus route IDs...");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("data", query);
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            String response = restTemplate.postForObject(OVERPASS_API_URL, request, String.class);
            OverpassResponse overpassResponse = objectMapper.readValue(response, OverpassResponse.class);
            
            log.info("Found {} routes", 
                     overpassResponse.getElements() != null ? overpassResponse.getElements().size() : 0);
            
            return overpassResponse;
        } catch (Exception e) {
            log.error("Error fetching route IDs", e);
            throw new RuntimeException("Failed to fetch bus route IDs", e);
        }
    }

    /**
     * Fetches all bus routes from Rabat, Salé, and Témara with full geometry
     */
    public OverpassResponse fetchAllBusRoutes() {
        // Using bounding box for Rabat-Salé-Témara region in Morocco
        // Approximate coordinates: Rabat (33.97, -6.85), Salé (34.05, -6.79), Témara (33.93, -6.91)
        String query = "[out:json][timeout:90];" +
            "(" +
            "  relation[\"route\"=\"bus\"](33.85,--7.0,34.15,-6.7);" +
            ");" +
            "(._;>;);" +
            "out geom;";

        try {
            log.info("Fetching bus routes from Overpass API (Rabat-Salé-Témara, Morocco)...");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("data", query);
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            String response = restTemplate.postForObject(OVERPASS_API_URL, request, String.class);
            OverpassResponse overpassResponse = objectMapper.readValue(response, OverpassResponse.class);
            
            log.info("Successfully fetched {} elements from Overpass API", 
                     overpassResponse.getElements() != null ? overpassResponse.getElements().size() : 0);
            
            return overpassResponse;
        } catch (Exception e) {
            log.error("Error fetching data from Overpass API", e);
            throw new RuntimeException("Failed to fetch bus routes from Overpass API", e);
        }
    }

    /**
     * Fetches a specific bus route by relation ID
     */
    public OverpassResponse fetchBusRouteById(Long relationId) {
        String query = String.format(
            "[out:json];" +
            "relation(%d);" +
            "(._;>;);" +
            "out geom;", relationId);

        try {
            log.info("Fetching bus route {} from Overpass API...", relationId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("data", query);
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            String response = restTemplate.postForObject(OVERPASS_API_URL, request, String.class);
            return objectMapper.readValue(response, OverpassResponse.class);
        } catch (Exception e) {
            log.error("Error fetching route {} from Overpass API", relationId, e);
            throw new RuntimeException("Failed to fetch bus route " + relationId, e);
        }
    }
}
