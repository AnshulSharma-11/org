package com.orgpluse.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * ApiResponse<T>
 *
 * The single, canonical response envelope for every endpoint in the application.
 * Replaces the mutable, singleton-scoped {@link com.orgpluse.response_wrapper.ResponseWrapper}
 * which had a concurrency bug (shared state across threads).
 *
 * Structure
 * ─────────
 * {
 *   "success"   : true | false,
 *   "status"    : 200 | 400 | 404 | ...,
 *   "message"   : "Human-readable summary",
 *   "timestamp" : "2025-06-01T10:30:00Z",
 *   "data"      : { ... } | null,         // present on success
 *   "errors"    : [ ... ] | null          // present on validation failures
 * }
 *
 * Rules
 * ─────
 * - Fields with null values are omitted from JSON (@JsonInclude NON_NULL).
 * - Instances are immutable after construction — no setters.
 * - All factory methods are static so callers never call `new ApiResponse<>(...)`.
 * - The class is generic so the compiler enforces the correct data type at each call site.
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final int     status;
    private final String  message;
    private final String  timestamp;
    private final T       data;

    /**
     * Structured field-level validation errors.
     * Present only on 400 responses from @Valid failures.
     * Map key = field name, value = constraint message.
     */
    private final Map<String, List<String>> errors;

    // ── private constructor — use factory methods below ───────────────────────

    private ApiResponse(boolean success, int status, String message,
                        T data, Map<String, List<String>> errors) {
        this.success   = success;
        this.status    = status;
        this.message   = message;
        this.timestamp = Instant.now().toString();
        this.data      = data;
        this.errors    = errors;
    }

    // ── SUCCESS factories ─────────────────────────────────────────────────────

    /** 200 OK with payload */
    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, 200, message, data, null);
    }

    /** 201 Created with payload */
    public static <T> ApiResponse<T> created(String message, T data) {
        return new ApiResponse<>(true, 201, message, data, null);
    }

    /** Any 2xx status with payload */
    public static <T> ApiResponse<T> success(String message, T data, int status) {
        return new ApiResponse<>(true, status, message, data, null);
    }

    // ── ERROR factories ───────────────────────────────────────────────────────

    /** Any 4xx / 5xx without field-level detail */
    public static <T> ApiResponse<T> error(String message, int status) {
        return new ApiResponse<>(false, status, message, null, null);
    }

    /** 400 with field-level validation errors */
    public static <T> ApiResponse<T> validationError(String message,
                                                       Map<String, List<String>> errors) {
        return new ApiResponse<>(false, 400, message, null, errors);
    }

}
