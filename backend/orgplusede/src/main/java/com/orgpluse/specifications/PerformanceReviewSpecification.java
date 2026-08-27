package com.orgpluse.specifications;

import org.springframework.data.jpa.domain.Specification;

import com.orgpluse.entities.PerformanceReview;

import java.time.LocalDate;

public class PerformanceReviewSpecification {

    public static Specification<PerformanceReview> hasEmployee(Long employeeId) {
        return (root, query, cb) -> {
            if (employeeId == null) return null;
            return cb.equal(root.get("employee").get("id"), employeeId);
        };
    }

    public static Specification<PerformanceReview> hasReviewer(Long reviewerId) {
        return (root, query, cb) -> {
            if (reviewerId == null) return null;
            return cb.equal(root.get("reviewer").get("id"), reviewerId);
        };
    }

    public static Specification<PerformanceReview> hasStatus(String status) {
        return (root, query, cb) -> {
            if (status == null || status.isBlank()) return null;
            return cb.equal(cb.lower(root.get("status")), status.toLowerCase());
        };
    }

    public static Specification<PerformanceReview> hasCycleName(String cycleName) {
        return (root, query, cb) -> {
            if (cycleName == null || cycleName.isBlank()) return null;
            String pattern = "%" + cycleName.toLowerCase() + "%";
            return cb.like(cb.lower(root.get("cycleName")), pattern);
        };
    }

    public static Specification<PerformanceReview> startDateFrom(LocalDate from) {
        return (root, query, cb) -> {
            if (from == null) return null;
            return cb.greaterThanOrEqualTo(root.get("startDate"), from);
        };
    }

    public static Specification<PerformanceReview> endDateTo(LocalDate to) {
        return (root, query, cb) -> {
            if (to == null) return null;
            return cb.lessThanOrEqualTo(root.get("endDate"), to);
        };
    }

    public static Specification<PerformanceReview> sortByField(String sortBy,
                                                                 String sortDirection) {
        return (root, query, cb) -> {
            if (sortBy == null || sortBy.isBlank()) return null;
            if ("desc".equalsIgnoreCase(sortDirection)) {
                query.orderBy(cb.desc(root.get(sortBy)));
            } else {
                query.orderBy(cb.asc(root.get(sortBy)));
            }
            return null;
        };
    }

}
