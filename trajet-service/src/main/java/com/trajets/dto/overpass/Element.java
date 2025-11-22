package com.trajets.dto.overpass;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Element {
    private String type;  // "relation", "way", "node"
    private Long id;
    private Map<String, String> tags;
    private List<Member> members;  // For relations
    private List<Long> nodes;      // For ways
    private List<Geometry> geometry; // For ways with "out geom"
    private Double lat;             // For nodes
    private Double lon;             // For nodes
}
