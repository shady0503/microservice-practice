package com.urbanmovems.tickets.exception;

public class TicketNotPayableException extends RuntimeException {
    public TicketNotPayableException(String message) {
        super(message);
    }
}