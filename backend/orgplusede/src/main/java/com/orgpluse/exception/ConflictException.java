package com.orgpluse.exception;

/**
 * Thrown when a request is valid but conflicts with the current state of a
 * resource (e.g. checking in twice, or checking in while on approved leave).
 * GlobalExceptionHandler maps this to HTTP 409 Conflict.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }

}
