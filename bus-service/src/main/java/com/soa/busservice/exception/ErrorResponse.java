package com.soa.busservice.exception;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standard error response DTO.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {
    
    private int status;
    private String error;
    private String message;
    private LocalDateTime timestamp;
    private String path;
}
