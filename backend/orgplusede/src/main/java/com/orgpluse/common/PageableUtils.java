package com.orgpluse.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

/**
 * PageableUtils
 *
 * Central factory for Pageable objects.  Every service calls
 * PageableUtils.of(...) instead of duplicating PageRequest.of logic.
 *
 * Defaults
 * ────────
 *   page      : 0        (first page)
 *   size      : 20       (20 rows per page — safe default for all modules)
 *   sortBy    : "id"     (stable, indexed default sort)
 *   direction : ASC
 *
 * Limits
 * ──────
 *   Minimum page : 0
 *   Minimum size : 1
 *   Maximum size : 200   (prevents a caller requesting size=10000 and OOM-ing the JVM)
 *
 * Why a factory instead of @PageableDefault?
 * ───────────────────────────────────────────
 * @PageableDefault only works on controller parameters.  The existing project
 * puts sort logic inside Specification objects rather than Pageable, so we
 * need a single place that the service layer can call, with consistent clamping
 * and a safe fallback sort column.
 */
public final class PageableUtils {

    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE     = 200;

    private PageableUtils() {}

    /**
     * Build a validated Pageable from raw request parameters.
     *
     * @param page          0-based page index (null → 0)
     * @param size          rows per page (null → 20, clamped to [1, 200])
     * @param sortBy        field name to sort by (null or blank → "id")
     * @param sortDirection "asc" or "desc" (null or anything else → ASC)
     * @param allowedSorts  set of field names the caller permits sorting by;
     *                      if sortBy is not in this set it falls back to "id".
     *                      Pass an empty set to skip validation.
     */
    public static Pageable of(Integer page,
                               Integer size,
                               String  sortBy,
                               String  sortDirection,
                               Set<String> allowedSorts) {

        int resolvedPage = (page == null || page < 0) ? DEFAULT_PAGE : page;
        int resolvedSize = (size == null) ? DEFAULT_SIZE : Math.min(Math.max(size, 1), MAX_SIZE);

        Sort.Direction dir = "desc".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        String field = resolveField(sortBy, allowedSorts);

        return PageRequest.of(resolvedPage, resolvedSize, Sort.by(dir, field));
    }

    /**
     * Overload without allowedSorts validation.
     * Use only for endpoints where any field name is safe (e.g. simple tables).
     */
    public static Pageable of(Integer page, Integer size,
                               String sortBy, String sortDirection) {
        return of(page, size, sortBy, sortDirection, Set.of());
    }

    // ── private ───────────────────────────────────────────────────────────────

    private static String resolveField(String sortBy, Set<String> allowed) {
        if (sortBy == null || sortBy.isBlank()) return "id";
        if (allowed.isEmpty()) return sortBy;
        return allowed.contains(sortBy) ? sortBy : "id";
    }

}
