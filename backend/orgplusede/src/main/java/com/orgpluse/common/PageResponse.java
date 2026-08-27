package com.orgpluse.common;

import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * PageResponse<T>
 *
 * A reusable, serialisation-safe envelope that wraps Spring's Page<T> into a
 * plain object. Spring's Page implementation carries internal proxy state that
 * can cause recursive serialisation when handed directly to Jackson, so we
 * extract only the fields that callers actually need.
 *
 * Every paginated endpoint returns:
 *
 *   {
 *     "message": "...",
 *     "data": {
 *       "content":       [ ... ],   <- the items on this page
 *       "page":          0,         <- current page (0-based)
 *       "size":          20,        <- requested page size
 *       "totalElements": 143,       <- total matching rows in DB
 *       "totalPages":    8,         <- ceil(totalElements / size)
 *       "first":         true,
 *       "last":          false
 *     }
 *   }
 *
 * This lets the frontend render pagination controls without any extra requests.
 */
@Getter
public class PageResponse<T> {

    private final List<T> content;
    private final int     page;
    private final int     size;
    private final long    totalElements;
    private final int     totalPages;
    private final boolean first;
    private final boolean last;

    /**
     * Build from any Spring Page<T>.
     * Usage in a service: return new PageResponse<>(repository.findAll(spec, pageable));
     */
    public PageResponse(Page<T> page) {
        this.content       = page.getContent();
        this.page          = page.getNumber();
        this.size          = page.getSize();
        this.totalElements = page.getTotalElements();
        this.totalPages    = page.getTotalPages();
        this.first         = page.isFirst();
        this.last          = page.isLast();
    }

}
