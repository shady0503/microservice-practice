package com.soa.busservice.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusLineChangeEvent {
    private String busId;
    private String oldLineCode;
    private String newLineCode;
}