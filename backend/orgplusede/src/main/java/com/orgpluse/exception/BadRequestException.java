package com.orgpluse.exception;

/**
 * Thrown when a request is syntactically valid but semantically wrong
 * according to business rules.
 *
 * Examples:
 *   - Leave end date before start date
 *   - Employee set as their own manager
 *   - Department set as its own parent
 *   - Attempting to modify a PAID payroll record
 *
 * GlobalExceptionHandler maps this to HTTP 400 Bad Request.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }

}
