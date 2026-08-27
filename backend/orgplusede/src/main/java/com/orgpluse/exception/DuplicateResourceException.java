package com.orgpluse.exception;

/**
 * Thrown when a create/update would produce a duplicate that violates a
 * business-level uniqueness rule (e.g. duplicate email, duplicate payroll period).
 *
 * Distinct from DataIntegrityViolationException, which originates from the DB
 * layer after the INSERT/UPDATE reaches MySQL. This exception fires BEFORE the
 * DB call, from a service-level existsBy… check, giving a cleaner message.
 *
 * GlobalExceptionHandler maps this to HTTP 409 Conflict.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }

}
