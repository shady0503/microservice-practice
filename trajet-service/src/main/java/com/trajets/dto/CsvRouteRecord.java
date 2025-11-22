// src/main/java/com/trajets/dto/CsvRouteRecord.java
package com.trajets.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CsvRouteRecord {
    private String ref;              // Line number (e.g., "32H", "31")
    private String name;             // Route name with direction
    private String osmRelationId;    // Single OSM relation ID
}