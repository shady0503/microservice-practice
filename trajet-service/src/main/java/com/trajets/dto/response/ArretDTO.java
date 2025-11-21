package com.trajets.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ArretDTO {
    private Long id;
    private String nom;
    private Double latitude;
    private Double longitude;
    private String address;
}
