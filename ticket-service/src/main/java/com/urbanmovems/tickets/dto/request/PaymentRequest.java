package com.urbanmovems.tickets.dto.request;

import com.urbanmovems.tickets.model.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequest {

    @NotNull(message = "La méthode de paiement ne peut pas être nulle")
    private PaymentMethod paymentMethod;

    // Champs optionnels pour paiement par carte (mock)
    private String cardNumber;
    private String cardExpiry;
    private String cardCvv;
}