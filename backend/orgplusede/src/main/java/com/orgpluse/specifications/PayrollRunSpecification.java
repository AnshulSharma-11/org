package com.orgpluse.specifications;

import org.springframework.data.jpa.domain.Specification;

import com.orgpluse.entities.PayrollRun;

public class PayrollRunSpecification {

    public static Specification<PayrollRun> hasEmployee(Long employeeId) {
        return (root, query, cb) -> {
            if (employeeId == null) return null;
            return cb.equal(root.get("employee").get("id"), employeeId);
        };
    }

    public static Specification<PayrollRun> hasMonth(Integer month) {
        return (root, query, cb) -> {
            if (month == null) return null;
            return cb.equal(root.get("month"), month);
        };
    }

    public static Specification<PayrollRun> hasYear(Integer year) {
        return (root, query, cb) -> {
            if (year == null) return null;
            return cb.equal(root.get("year"), year);
        };
    }

    public static Specification<PayrollRun> hasStatus(String status) {
        return (root, query, cb) -> {
            if (status == null || status.isBlank()) return null;
            return cb.equal(cb.lower(root.get("status")), status.toLowerCase());
        };
    }

    public static Specification<PayrollRun> hasProcessedBy(Long processedById) {
        return (root, query, cb) -> {
            if (processedById == null) return null;
            return cb.equal(root.get("processedBy").get("id"), processedById);
        };
    }

    // Compound sort: year first, then month within the same year
    public static Specification<PayrollRun> sortByYearMonth(String sortDirection) {
        return (root, query, cb) -> {
            if ("desc".equalsIgnoreCase(sortDirection)) {
                query.orderBy(
                        cb.desc(root.get("year")),
                        cb.desc(root.get("month"))
                );
            } else {
                query.orderBy(
                        cb.asc(root.get("year")),
                        cb.asc(root.get("month"))
                );
            }
            return null;
        };
    }

    public static Specification<PayrollRun> sortByField(String sortBy, String sortDirection) {
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
