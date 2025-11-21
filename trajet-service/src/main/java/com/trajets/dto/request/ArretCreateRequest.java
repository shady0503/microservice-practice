package com.trajets.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ArretCreateRequest {
    
    @NotBlank(message = "Le nom de l'arrêt ne peut pas être vide")
    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    private String nom;
    
    private Double latitude;
    
    private Double longitude;
    
    @Size(max = 500, message = "L'adresse ne peut pas dépasser 500 caractères")
    private String address;
}