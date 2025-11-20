package com.urbanmovems.tickets.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urbanmovems.tickets.model.IdempotencyRecord;
import com.urbanmovems.tickets.repository.IdempotencyRecordRepository;
import com.urbanmovems.tickets.service.IdempotencyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
@Slf4j
public class IdempotencyServiceImpl implements IdempotencyService {

    private final IdempotencyRecordRepository idempotencyRepository;
    private final ObjectMapper objectMapper;

    private static final int IDEMPOTENCY_EXPIRY_HOURS = 24;

    @Override
    @Transactional
    public <T> ResponseEntity<T> executeIdempotent(
            UUID idempotencyKey,
            String requestPath,
            String requestMethod,
            Supplier<ResponseEntity<T>> operation) {

        log.debug("Checking idempotency for key: {}", idempotencyKey);

        return idempotencyRepository.findById(idempotencyKey)
                .map(record -> {
                    if (record.isExpired()) {
                        idempotencyRepository.delete(record);
                        return executeAndCache(idempotencyKey, requestPath, requestMethod, operation);
                    } else {
                        log.info("Returning cached response for idempotency key: {}", idempotencyKey);
                        @SuppressWarnings("unchecked")
                        ResponseEntity<T> cached = (ResponseEntity<T>) deserializeResponse(record);
                        return cached;
                    }
                })
                .orElseGet(() -> executeAndCache(idempotencyKey, requestPath, requestMethod, operation));
    }

    private <T> ResponseEntity<T> executeAndCache(
            UUID idempotencyKey,
            String requestPath,
            String requestMethod,
            Supplier<ResponseEntity<T>> operation) {

        ResponseEntity<T> response = operation.get();

        try {
            String responseBody = objectMapper.writeValueAsString(response.getBody());

            IdempotencyRecord record = IdempotencyRecord.builder()
                    .idempotencyKey(idempotencyKey)
                    .requestPath(requestPath)
                    .requestMethod(requestMethod)
                    .responseStatus(response.getStatusCode().value())
                    .responseBody(responseBody)
                    .expiresAt(LocalDateTime.now().plusHours(IDEMPOTENCY_EXPIRY_HOURS))
                    .build();

            idempotencyRepository.save(record);
            log.info("Cached response for idempotency key: {}", idempotencyKey);
        } catch (Exception e) {
            log.error("Error caching idempotency response", e);
        }

        return response;
    }

    @SuppressWarnings("unchecked")
    private <T> ResponseEntity<T> deserializeResponse(IdempotencyRecord record) {
        try {
            T body = (T) objectMapper.readValue(record.getResponseBody(), Object.class);
            return ResponseEntity.status(record.getResponseStatus()).body(body);
        } catch (Exception e) {
            log.error("Error deserializing idempotency response", e);
            return (ResponseEntity<T>) ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    @Transactional
    public void cleanupExpiredRecords() {
        int deleted = idempotencyRepository.deleteExpiredRecords(LocalDateTime.now());
        log.info("Cleaned up {} expired idempotency records", deleted);
    }
}
