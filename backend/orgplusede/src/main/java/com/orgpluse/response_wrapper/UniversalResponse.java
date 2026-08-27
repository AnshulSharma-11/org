package com.orgpluse.response_wrapper;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

/**
 * UniversalResponse — thin factory kept for backward compatibility with all
 * existing services that call response.send(...).
 *
 * CONCURRENCY FIX: each call now creates a new ResponseWrapper instance
 * instead of mutating a shared singleton. This eliminates the race condition
 * where two concurrent requests could overwrite each other's message/data.
 *
 * New code should prefer returning ApiResponse<T> directly from services
 * via ApiResponse.ok(...) / ApiResponse.error(...), but all existing
 * service code continues to work unchanged.
 */
@Component
public class UniversalResponse {

    public ResponseEntity<ResponseWrapper> send(String message, Object data, HttpStatus status) {
        // New instance per call — no shared mutable state
        return new ResponseEntity<>(new ResponseWrapper(message, data), status);
    }

}
