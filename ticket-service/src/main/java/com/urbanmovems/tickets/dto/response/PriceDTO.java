package com.urbanmovems.tickets.dto.response;

import com.urbanmovems.tickets.model.Price;
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
public class PriceDTO {

    private Integer amount;
    private String currency;

    public static PriceDTO fromPrice(Price price) {
        if (price == null) {
            return null;
        }
        return PriceDTO.builder()
                .amount(price.getAmount())
                .currency(price.getCurrency())
                .build();
    }
}