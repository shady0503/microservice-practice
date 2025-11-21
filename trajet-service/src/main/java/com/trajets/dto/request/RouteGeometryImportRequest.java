package com.trajets.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteGeometryImportRequest {
    private List<RouteData> routes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteData {
        private String routeId;          // OSM relation ID
        private String ref;              // Route reference (e.g., "32H")
        private String name;             // Full name
        private String from;             // Origin
        private String to;               // Destination
        private String operator;         // Operator name
        private String colour;           // Route color
        private Map<String, Object> geometry;  // GeoJSON geometry object
        private List<StopData> stops;    // Bus stops
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StopData {
        private String nodeId;           // OSM node ID
        private String name;             // Stop name
        private Double latitude;
        private Double longitude;
    }
}
