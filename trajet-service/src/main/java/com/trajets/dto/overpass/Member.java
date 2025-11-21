package com.trajets.dto.overpass;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Member {
    private String type;  // "node", "way", "relation"
    private Long ref;     // Reference ID
    private String role;  // "stop", "platform", "" (empty for route ways)
}
