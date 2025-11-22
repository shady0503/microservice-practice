// src/main/java/com/trajets/dto/OsmRouteData.java
package com.trajets.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class OsmRouteData {
    private String relationId;
    private String ref;
    private String name;
    private String direction;
    private String geometryGeoJson; // LineString GeoJSON
    private List<OsmStopData> stops = new ArrayList<>();
}