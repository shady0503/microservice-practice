package com.urbanmovems.tickets.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketRequest {

    @NotNull(message = "L'ID de l'utilisateur ne peut pas être nul")
    private UUID userId;

    @NotNull(message = "L'ID du trajet ne peut pas être nul")
    @Min(value = 1, message = "L'ID du trajet doit être positif")
    private Long trajetId;

    @NotNull(message = "La quantité ne peut pas être nulle")
    @Min(value = 1, message = "La quantité doit être au moins 1")
    @Max(value = 10, message = "La quantité ne peut pas dépasser 10")
    private Integer quantity;

    private Map<String, Object> metadata;
}