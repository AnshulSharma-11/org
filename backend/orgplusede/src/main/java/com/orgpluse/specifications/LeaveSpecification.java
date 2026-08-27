package com.orgpluse.specifications;

import org.springframework.data.jpa.domain.Specification;

import com.orgpluse.entities.Leave;

import java.time.LocalDate;

public class LeaveSpecification {

    public static Specification<Leave> hasEmployee(Long employeeId) {
        return (root, query, cb) -> {
            if (employeeId == null) return null;
            return cb.equal(root.get("employee").get("id"), employeeId);
        };
    }

    public static Specification<Leave> hasStatus(String status) {
        return (root, query, cb) -> {
            if (status == null || status.isBlank()) return null;
            return cb.equal(cb.lower(root.get("status")), status.toLowerCase());
        };
    }

    public static Specification<Leave> hasLeaveType(String leaveType) {
        return (root, query, cb) -> {
            if (leaveType == null || leaveType.isBlank()) return null;
            return cb.equal(cb.lower(root.get("leaveType")), leaveType.toLowerCase());
        };
    }

    public static Specification<Leave> startDateFrom(LocalDate startDate) {
        return (root, query, cb) -> {
            if (startDate == null) return null;
            return cb.greaterThanOrEqualTo(root.get("startDate"), startDate);
        };
    }

    public static Specification<Leave> endDateTo(LocalDate endDate) {
        return (root, query, cb) -> {
            if (endDate == null) return null;
            return cb.lessThanOrEqualTo(root.get("endDate"), endDate);
        };
    }

    public static Specification<Leave> hasApprovedBy(Long approvedById) {
        return (root, query, cb) -> {
            if (approvedById == null) return null;
            return cb.equal(root.get("approvedBy").get("id"), approvedById);
        };
    }

    public static Specification<Leave> sortByField(String sortBy, String sortDirection) {
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
