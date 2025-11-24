// src/main/java/com/trajets/dto/OsmStopData.java
package com.trajets.dto;

import lombok.Data;

@Data
public class OsmStopData {
    private String nodeId;
    private String name;
    private Double latitude;
    private Double longitude;
    private Integer order;
}