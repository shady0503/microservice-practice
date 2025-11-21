package com.trajets.dto.overpass;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OverpassResponse {
    private String version;
    private String generator;
    private List<Element> elements;
}
