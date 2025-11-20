package com.soa.busservice.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

/**
 * Global exception handler for REST controllers.
 * Provides consistent error response format across all endpoints.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    /**
     * Handle resource not found exceptions.
     */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorResponse> handleNoSuchElementException(
            NoSuchElementException ex,
            WebRequest request) {
        
        log.warn("Resource not found: {}", ex.getMessage());
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .error("Not Found")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }
    
    /**
     * Handle illegal argument exceptions (e.g., duplicate matricule).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex,
            WebRequest request) {
        
        log.warn("Invalid argument: {}", ex.getMessage());
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Handle validation errors from request body validation.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex,
            WebRequest request) {
        
        String message = ex.getBindingResult().getAllErrors().stream()
                .map(error -> error.getDefaultMessage())
                .reduce((m1, m2) -> m1 + "; " + m2)
                .orElse("Validation failed");
        
        log.warn("Validation error: {}", message);
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Failed")
                .message(message)
                .timestamp(LocalDateTime.now())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Handle all other exceptions.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            WebRequest request) {
        
        log.error("Unexpected error: ", ex);
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("An unexpected error occurred")
                .timestamp(LocalDateTime.now())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
