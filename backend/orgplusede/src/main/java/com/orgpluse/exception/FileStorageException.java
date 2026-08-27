package com.orgpluse.exception;

/**
 * Thrown by EmployeeDocumentService when a file operation fails.
 * Wraps IOException so callers do not need to handle checked exceptions.
 *
 * GlobalExceptionHandler maps this to HTTP 500 Internal Server Error
 * with a safe message — the original IOException detail is logged server-side
 * but never returned to the client.
 */
public class FileStorageException extends RuntimeException {

    public FileStorageException(String message, Throwable cause) {
        super(message, cause);
    }

    public FileStorageException(String message) {
        super(message);
    }

}
