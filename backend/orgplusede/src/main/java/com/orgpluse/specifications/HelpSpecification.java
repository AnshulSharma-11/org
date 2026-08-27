package com.orgpluse.specifications;

import org.springframework.data.jpa.domain.Specification;

import com.orgpluse.entities.Help;

public class HelpSpecification {

    public static Specification<Help> hasRequestType(String requestType) {
        return (root, query, cb) -> {
            if (requestType == null || requestType.isBlank()) return null;
            return cb.equal(cb.lower(root.get("requestType")), requestType.toLowerCase());
        };
    }

    public static Specification<Help> hasStatus(String status) {
        return (root, query, cb) -> {
            if (status == null || status.isBlank()) return null;
            return cb.equal(cb.lower(root.get("status")), status.toLowerCase());
        };
    }

    public static Specification<Help> hasPriority(String priority) {
        return (root, query, cb) -> {
            if (priority == null || priority.isBlank()) return null;
            return cb.equal(cb.lower(root.get("priority")), priority.toLowerCase());
        };
    }

    public static Specification<Help> hasEmployee(Long employeeId) {
        return (root, query, cb) -> {
            if (employeeId == null) return null;
            return cb.equal(root.get("employee").get("id"), employeeId);
        };
    }

    public static Specification<Help> hasAssignedTo(Long assignedToId) {
        return (root, query, cb) -> {
            if (assignedToId == null) return null;
            return cb.equal(root.get("assignedTo").get("id"), assignedToId);
        };
    }

    public static Specification<Help> hasCurrentDepartment(Long departmentId) {
        return (root, query, cb) -> {
            if (departmentId == null) return null;
            return cb.equal(root.get("currentDepartment").get("id"), departmentId);
        };
    }

    public static Specification<Help> hasRequestedDepartment(Long departmentId) {
        return (root, query, cb) -> {
            if (departmentId == null) return null;
            return cb.equal(root.get("requestedDepartment").get("id"), departmentId);
        };
    }

    public static Specification<Help> searchBySubject(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return null;
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.like(cb.lower(root.get("subject")), pattern);
        };
    }

    public static Specification<Help> sortByField(String sortBy, String sortDirection) {
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
