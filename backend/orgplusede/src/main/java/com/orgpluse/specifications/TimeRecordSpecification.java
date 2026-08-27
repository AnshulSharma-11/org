package com.orgpluse.specifications;

import org.springframework.data.jpa.domain.Specification;

import com.orgpluse.entities.TimeRecord;

import java.time.LocalDate;

public class TimeRecordSpecification {

    public static Specification<TimeRecord> hasEmployee(Long employeeId) {
        return (root, query, cb) -> {
            if (employeeId == null) return null;
            return cb.equal(root.get("employee").get("id"), employeeId);
        };
    }

    public static Specification<TimeRecord> hasStatus(String status) {
        return (root, query, cb) -> {
            if (status == null || status.isBlank()) return null;
            return cb.equal(cb.lower(root.get("status")), status.toLowerCase());
        };
    }

    public static Specification<TimeRecord> dateFrom(LocalDate from) {
        return (root, query, cb) -> {
            if (from == null) return null;
            return cb.greaterThanOrEqualTo(root.get("date"), from);
        };
    }

    public static Specification<TimeRecord> dateTo(LocalDate to) {
        return (root, query, cb) -> {
            if (to == null) return null;
            return cb.lessThanOrEqualTo(root.get("date"), to);
        };
    }

    public static Specification<TimeRecord> sortByDate(String sortDirection) {
        return (root, query, cb) -> {
            if ("desc".equalsIgnoreCase(sortDirection)) {
                query.orderBy(cb.desc(root.get("date")));
            } else {
                query.orderBy(cb.asc(root.get("date")));
            }
            return null;
        };
    }

    public static Specification<TimeRecord> sortByField(String sortBy, String sortDirection) {
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
