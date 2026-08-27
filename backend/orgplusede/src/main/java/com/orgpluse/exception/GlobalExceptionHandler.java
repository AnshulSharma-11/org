package com.orgpluse.exception;

import com.orgpluse.common.ApiResponse;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * GlobalExceptionHandler
 *
 * Central @ControllerAdvice that intercepts every exception thrown by any
 * controller or service in the application and converts it to a consistent
 * {@link ApiResponse} JSON body. No stack trace is ever written to the HTTP
 * response — full details are logged at ERROR level server-side only.
 *
 * Handler priority (Spring resolves the most-specific type first):
 *
 *   1. ResourceNotFoundException          → 404 Not Found
 *   2. DuplicateResourceException         → 409 Conflict
 *   3. BadRequestException                → 400 Bad Request
 *   4. AuthenticationException            → 401 Unauthorized
 *   5. AccessDeniedException              → 403 Forbidden
 *   6. FileStorageException               → 500 Internal Server Error
 *   7. MethodArgumentNotValidException    → 400 + field errors map
 *   8. ConstraintViolationException       → 400 + field errors map
 *   9. DataIntegrityViolationException    → 409 Conflict  (DB-level duplicate)
 *  10. HttpMessageNotReadableException    → 400 Malformed JSON
 *  11. MissingServletRequestParameterException → 400
 *  12. MethodArgumentTypeMismatchException    → 400
 *  13. HttpRequestMethodNotAllowedException   → 405
 *  14. HttpMediaTypeNotSupportedException     → 415
 *  15. MaxUploadSizeExceededException         → 413
 *  16. NoResourceFoundException               → 404
 *  17. IllegalArgumentException               → 400
 *  18. IllegalStateException                  → 500
 *  19. Exception (catch-all)                  → 500
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── 1. Resource not found — 404 ───────────────────────────────────────────

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(
            ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage(), 404));
    }

    // ── 2. Duplicate resource — 409 ───────────────────────────────────────────

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Void>> handleDuplicate(
            DuplicateResourceException ex) {
        log.warn("Duplicate resource: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage(), 409));
    }

    // ── 3. Business rule violation — 400 ─────────────────────────────────────

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(BadRequestException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), 400));
    }

    // ── 4. Authentication failure — 401 ───────────────────────────────────────

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(
            AuthenticationException ex) {
        // Do NOT log the attempted email — avoid PII in logs
        log.warn("Authentication failure (details withheld)");
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage(), 401));
    }

    // ── 5. Access denied — 403 ────────────────────────────────────────────────

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
            AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage(), 403));
    }

    // ── 6. File storage failure — 500 ─────────────────────────────────────────

    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<ApiResponse<Void>> handleFileStorage(FileStorageException ex) {
        // Log full cause server-side; return a safe generic message to client
        log.error("File storage error: {}", ex.getMessage(), ex.getCause());
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("A file storage error occurred. Please try again.", 500));
    }

    // ── 7. Bean Validation (@Valid on @RequestBody) — 400 ────────────────────

    /**
     * Handles @Valid failures on @RequestBody DTOs and entity parameters.
     *
     * Produces a structured errors map:
     * {
     *   "errors": {
     *     "email":    ["Email must be valid"],
     *     "password": ["Password must be at least 6 characters"]
     *   }
     * }
     *
     * Multiple violations on the same field are collected into the list,
     * so the client sees all problems in one response instead of one at a time.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, List<String>> fieldErrors = new LinkedHashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(fe -> {
            String field   = fe.getField();
            String message = fe.getDefaultMessage() != null
                    ? fe.getDefaultMessage() : "Invalid value";
            fieldErrors
                    .computeIfAbsent(field, k -> new ArrayList<>())
                    .add(message);
        });

        // Also capture object-level (class-level) constraint violations
        ex.getBindingResult().getGlobalErrors().forEach(oe -> {
            String key     = oe.getObjectName();
            String message = oe.getDefaultMessage() != null
                    ? oe.getDefaultMessage() : "Invalid value";
            fieldErrors
                    .computeIfAbsent(key, k -> new ArrayList<>())
                    .add(message);
        });

        log.warn("Validation failed — {} field error(s)", fieldErrors.size());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.validationError(
                        "Validation failed. Please correct the highlighted fields.", fieldErrors));
    }

    // ── 8. ConstraintViolation (@Valid on @RequestParam / @PathVariable) — 400

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(
            ConstraintViolationException ex) {

        Map<String, List<String>> fieldErrors = new LinkedHashMap<>();
        for (ConstraintViolation<?> cv : ex.getConstraintViolations()) {
            // Path format is "methodName.paramName" — extract last segment
            String path    = cv.getPropertyPath().toString();
            String field   = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
            String message = cv.getMessage();
            fieldErrors
                    .computeIfAbsent(field, k -> new ArrayList<>())
                    .add(message);
        }

        log.warn("Constraint violation — {} error(s)", fieldErrors.size());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.validationError("Validation failed.", fieldErrors));
    }

    // ── 9. DataIntegrityViolation (DB-level duplicate / FK) — 409 ────────────

    /**
     * Fires when a DB INSERT/UPDATE violates a unique or FK constraint that
     * wasn't caught by a service-level existsBy… check.
     *
     * The root cause message from Hibernate/MySQL is logged but NEVER sent to
     * the client — it contains table names, column names, and constraint names
     * that expose the schema and aid SQL injection attacks.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(
            DataIntegrityViolationException ex) {
        log.error("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());

        // Produce a user-friendly message by inspecting the root cause string
        String rootMsg = ex.getMostSpecificCause().getMessage();
        String clientMsg;

        if (rootMsg != null && rootMsg.toLowerCase().contains("duplicate entry")) {
            clientMsg = "A record with that value already exists.";
        } else if (rootMsg != null && rootMsg.toLowerCase().contains("foreign key constraint")) {
            clientMsg = "The referenced record does not exist or cannot be deleted because " +
                        "other records depend on it.";
        } else {
            clientMsg = "A database constraint violation occurred.";
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(clientMsg, 409));
    }

    // ── 10. Malformed JSON body — 400 ─────────────────────────────────────────

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadableMessage(
            HttpMessageNotReadableException ex) {
        log.warn("Malformed request body: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(
                        "Request body is missing or malformed. Please send valid JSON.", 400));
    }

    // ── 11. Missing required @RequestParam — 400 ──────────────────────────────

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(
            MissingServletRequestParameterException ex) {
        log.warn("Missing request parameter: {}", ex.getParameterName());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(
                        "Required parameter '" + ex.getParameterName() + "' is missing.", 400));
    }

    // ── 12. Type mismatch on path/query variable — 400 ───────────────────────

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex) {
        String expected = ex.getRequiredType() != null
                ? ex.getRequiredType().getSimpleName() : "unknown";
        String msg = "Parameter '" + ex.getName() + "' must be of type " + expected + ".";
        log.warn("Type mismatch: {}", msg);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(msg, 400));
    }

    // ── 13. Wrong HTTP method — 405 ───────────────────────────────────────────

 
    // ── 14. Wrong Content-Type — 415 ──────────────────────────────────────────

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnsupportedMediaType(
            HttpMediaTypeNotSupportedException ex) {
        log.warn("Unsupported media type: {}", ex.getContentType());
        return ResponseEntity
                .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(ApiResponse.error(
                        "Content-Type '" + ex.getContentType() + "' is not supported. "
                        + "Use application/json.", 415));
    }

    // ── 15. File too large — 413 ──────────────────────────────────────────────

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUploadSize(
            MaxUploadSizeExceededException ex) {
        log.warn("Upload size exceeded: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.error(
                        "File size exceeds the maximum allowed limit of 10MB.", 413));
    }

    // ── 16. No route found — 404 ──────────────────────────────────────────────

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoRoute(NoResourceFoundException ex) {
        log.warn("No route found: {}", ex.getResourcePath());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(
                        "The requested endpoint does not exist: " + ex.getResourcePath(), 404));
    }

    // ── 17. IllegalArgumentException — 400 ───────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(
            IllegalArgumentException ex) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), 400));
    }

    // ── 18. IllegalStateException — 500 ──────────────────────────────────────

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException ex) {
        log.error("Illegal state: {}", ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(
                        "An unexpected server state error occurred.", 500));
    }

    // ── 19. Catch-all — 500 ───────────────────────────────────────────────────

    /**
     * Last-resort handler for any exception not covered above.
     * Logs the full stack trace server-side; returns a generic 500 to the client.
     * This ensures stack traces, class names, and internal state NEVER reach the wire.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleAll(Exception ex) {
        log.error("Unhandled exception [{}]: {}", ex.getClass().getName(), ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(
                        "An unexpected error occurred. Please contact support if this persists.",
                        500));
    }

}
