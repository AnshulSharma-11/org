package com.orgpluse.response_wrapper;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * ResponseWrapper — legacy success-response envelope kept for backward
 * compatibility with existing services and controllers.
 *
 * IMPORTANT CHANGE: this class is now an IMMUTABLE value object.
 * It was previously a mutable @Component singleton (@Data with setters),
 * which was a concurrency bug — concurrent requests racing on the same
 * shared instance could mix up each other's messages and data.
 *
 * The singleton is removed. UniversalResponse now creates a fresh instance
 * per call. No service or controller that already uses UniversalResponse
 * needs to change.
 */
@Getter
@AllArgsConstructor
public class ResponseWrapper {

    private final String message;
    private final Object data;

}
