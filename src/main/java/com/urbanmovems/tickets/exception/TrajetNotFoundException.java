package com.urbanmovems.tickets.exception;

public class TrajetNotFoundException extends RuntimeException {
    public TrajetNotFoundException(String message) {
        super(message);
    }
}