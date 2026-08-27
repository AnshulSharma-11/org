package com.orgpluse.specifications;

import org.springframework.data.jpa.domain.Specification;

import com.orgpluse.entities.Designation;

public class DesignationSpecification {

    public static Specification<Designation> hasLevel(Integer level) {
        return (root, query, cb) -> {
            if (level == null) return null;
            return cb.equal(root.get("level"), level);
        };
    }

    public static Specification<Designation> searchByTitle(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return null;
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.like(cb.lower(root.get("title")), pattern);
        };
    }

    public static Specification<Designation> sortByField(String sortBy, String sortDirection) {
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
