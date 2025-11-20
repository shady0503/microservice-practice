package com.soa.busservice.controller;

import com.soa.busservice.dto.BusRequest;
import com.soa.busservice.dto.BusResponse;
import com.soa.busservice.dto.LocationUpdateRequest;
import com.soa.busservice.model.Status;
import com.soa.busservice.service.BusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/buses")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class BusController {

    private final BusService busService;

    @PostMapping
    public ResponseEntity<BusResponse> createBus(@Valid @RequestBody BusRequest request) {
        log.info("REST request to create bus: {}", request.getBusNumber());
        BusResponse response = busService.createBus(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<BusResponse>> getAllBuses() {
        log.info("REST request to get all buses");
        List<BusResponse> buses = busService.getAllBuses();
        return ResponseEntity.ok(buses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusResponse> getBusById(@PathVariable UUID id) {
        log.info("REST request to get bus by ID: {}", id);
        BusResponse response = busService.getBusById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/number/{busNumber}")
    public ResponseEntity<BusResponse> getBusByNumber(@PathVariable String busNumber) {
        log.info("REST request to get bus by number: {}", busNumber);
        BusResponse response = busService.getBusByNumber(busNumber);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<BusResponse>> getBusesByStatus(@PathVariable Status status) {
        log.info("REST request to get buses by status: {}", status);
        List<BusResponse> buses = busService.getBusesByStatus(status);
        return ResponseEntity.ok(buses);
    }

    @GetMapping("/line/{lineCode}")
    public ResponseEntity<List<BusResponse>> getBusesByLineCode(@PathVariable String lineCode) {
        log.info("REST request to get buses by line code: {}", lineCode);
        List<BusResponse> buses = busService.getBusesByLineCode(lineCode);
        return ResponseEntity.ok(buses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusResponse> updateBus(
            @PathVariable UUID id,
            @Valid @RequestBody BusRequest request) {
        log.info("REST request to update bus ID: {}", id);
        BusResponse response = busService.updateBus(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/location")
    public ResponseEntity<BusResponse> updateBusLocation(
            @PathVariable UUID id,
            @Valid @RequestBody LocationUpdateRequest request) {
        log.info("REST request to update bus location for ID: {}", id);
        BusResponse response = busService.updateBusLocation(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBus(@PathVariable UUID id) {
        log.info("REST request to delete bus ID: {}", id);
        busService.deleteBus(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.error("Bad request: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                System.currentTimeMillis()
        );
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        log.error("Internal server error", ex);
        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred",
                System.currentTimeMillis()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    // Error response DTO
    private record ErrorResponse(int status, String message, long timestamp) {}
}
