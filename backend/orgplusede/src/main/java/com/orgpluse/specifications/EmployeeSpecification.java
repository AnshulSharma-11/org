package com.orgpluse.specifications;

import org.springframework.data.jpa.domain.Specification;

import com.orgpluse.entities.Employee;

public class EmployeeSpecification {

    public static Specification<Employee> hasStatus(String status) {
        return (root, query, cb) -> {
            if (status == null || status.isBlank()) return null;
            return cb.equal(cb.lower(root.get("status")), status.toLowerCase());
        };
    }

    public static Specification<Employee> hasGender(String gender) {
        return (root, query, cb) -> {
            if (gender == null || gender.isBlank()) return null;
            return cb.equal(cb.lower(root.get("gender")), gender.toLowerCase());
        };
    }

    public static Specification<Employee> hasDepartment(Long departmentId) {
        return (root, query, cb) -> {
            if (departmentId == null) return null;
            return cb.equal(root.get("department").get("id"), departmentId);
        };
    }

    public static Specification<Employee> hasDesignation(Long designationId) {
        return (root, query, cb) -> {
            if (designationId == null) return null;
            return cb.equal(root.get("designation").get("id"), designationId);
        };
    }

    public static Specification<Employee> hasBranch(Long branchId) {
        return (root, query, cb) -> {
            if (branchId == null) return null;
            return cb.equal(root.get("branch").get("id"), branchId);
        };
    }

    public static Specification<Employee> hasManager(Long managerId) {
        return (root, query, cb) -> {
            if (managerId == null) return null;
            return cb.equal(root.get("manager").get("id"), managerId);
        };
    }

    public static Specification<Employee> searchByNameOrEmailOrCode(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return null;
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("employeeCode")), pattern)
            );
        };
    }

    public static Specification<Employee> sortByField(String sortBy, String sortDirection) {
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
