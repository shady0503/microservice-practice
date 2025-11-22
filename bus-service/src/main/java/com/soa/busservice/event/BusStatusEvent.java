package com.soa.busservice.event;

import com.soa.busservice.model.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusStatusEvent implements Serializable {
    private String busId;
    private String busNumber;
    private String lineCode;
    private Status oldStatus;
    private Status newStatus;
    private LocalDateTime timestamp;
}
