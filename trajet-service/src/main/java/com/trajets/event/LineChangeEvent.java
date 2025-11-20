package com.trajets.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LineChangeEvent implements Serializable {
    private Long lineId;
    private String lineCode;
    private String lineName;
    private ChangeType changeType;
    private LocalDateTime timestamp;

    public enum ChangeType {
        CREATED,
        UPDATED,
        DELETED
    }
}
