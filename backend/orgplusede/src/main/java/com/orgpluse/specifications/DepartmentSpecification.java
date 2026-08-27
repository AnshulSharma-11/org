package com.orgpluse.specifications;

import org.springframework.data.jpa.domain.Specification;

import com.orgpluse.entities.Department;

public class DepartmentSpecification {

    public static Specification<Department> hasIsActive(Boolean isActive) {
        return (root, query, cb) -> {
            if (isActive == null) return null;
            return cb.equal(root.get("isActive"), isActive);
        };
    }

    public static Specification<Department> hasManager(Long managerId) {
        return (root, query, cb) -> {
            if (managerId == null) return null;
            return cb.equal(root.get("manager").get("id"), managerId);
        };
    }

    public static Specification<Department> hasParentDepartment(Long parentDepartmentId) {
        return (root, query, cb) -> {
            if (parentDepartmentId == null) return null;
            return cb.equal(root.get("parentDepartment").get("id"), parentDepartmentId);
        };
    }

    public static Specification<Department> searchByName(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return null;
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.like(cb.lower(root.get("name")), pattern);
        };
    }

    public static Specification<Department> sortByField(String sortBy, String sortDirection) {
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
