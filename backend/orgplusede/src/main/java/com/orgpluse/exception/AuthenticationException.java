package com.orgpluse.exception;

/**
 * Thrown by auth services when credentials do not match a DB record.
 *
 * Deliberately uses the same generic message ("Invalid email or password")
 * regardless of whether the email is unknown or the password is wrong.
 * This prevents user enumeration attacks.
 *
 * GlobalExceptionHandler maps this to HTTP 401 Unauthorized.
 */
public class AuthenticationException extends RuntimeException {

    public AuthenticationException(String message) {
        super(message);
    }

}
