package com.orgpluse.exception;

/**
 * Thrown when an authenticated principal attempts an operation they are not
 * permitted to perform (e.g. an employee accessing another employee's document).
 *
 * GlobalExceptionHandler maps this to HTTP 403 Forbidden.
 *
 * Note: this is a project-level exception, not Spring Security's
 * AccessDeniedException. Since the project intentionally has no Spring Security,
 * this exception is thrown explicitly by service code.
 */
public class AccessDeniedException extends RuntimeException {

    public AccessDeniedException(String message) {
        super(message);
    }

}
