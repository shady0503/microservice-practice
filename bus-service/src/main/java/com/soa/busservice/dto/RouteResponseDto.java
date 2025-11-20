package com.soa.busservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.soa.busservice.model.Route;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for Route response that properly serializes geometry as a JSON array
 * instead of as a string.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteResponseDto {

    @JsonProperty("routeId")
    private UUID routeId;

    @JsonProperty("lineNumber")
    private String lineNumber;

    @JsonProperty("routeName")
    private String routeName;

    @JsonProperty("origin")
    private String origin;

    @JsonProperty("destination")
    private String destination;

    @JsonProperty("routeType")
    private String routeType;

    @JsonProperty("direction")
    private String direction;

    @JsonProperty("isActive")
    private Boolean isActive;

    /**
     * Geometry as a parsed JSON array (list of [lat, lon] coordinates).
     * This will be serialized as a proper JSON array in the API response.
     */
    @JsonProperty("geometry")
    private List<List<Double>> geometry;

    @JsonProperty("osmRelationId")
    private Long osmRelationId;

    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;

    /**
     * Convert a Route entity to RouteResponseDto, parsing the geometry string
     * into a proper JSON array structure.
     */
    public static RouteResponseDto fromRoute(Route route) throws IOException {
        List<List<Double>> parsedGeometry = null;

        // Parse the geometry string into a list of coordinates
        if (route.getGeometry() != null && !route.getGeometry().isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                parsedGeometry = mapper.readValue(
                    route.getGeometry(),
                    mapper.getTypeFactory().constructCollectionType(List.class, 
                        mapper.getTypeFactory().constructCollectionType(List.class, Double.class))
                );
            } catch (IOException e) {
                // Log and continue - geometry might be invalid
                throw new IOException("Failed to parse geometry for route " + route.getLineNumber(), e);
            }
        }

        return RouteResponseDto.builder()
            .routeId(route.getRouteId())
            .lineNumber(route.getLineNumber())
            .routeName(route.getRouteName())
            .origin(route.getOrigin())
            .destination(route.getDestination())
            .routeType(route.getRouteType())
            .direction(route.getDirection())
            .isActive(route.getIsActive())
            .geometry(parsedGeometry)
            .osmRelationId(route.getOsmRelationId())
            .createdAt(route.getCreatedAt())
            .updatedAt(route.getUpdatedAt())
            .build();
    }
}
