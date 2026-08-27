package com.orgpluse.specifications;

import org.springframework.data.jpa.domain.Specification;

import com.orgpluse.entities.Branch;

public class BranchSpecification {

    public static Specification<Branch> hasCity(String city) {
        return (root, query, cb) -> {
            if (city == null || city.isBlank()) return null;
            return cb.equal(cb.lower(root.get("city")), city.toLowerCase());
        };
    }

    public static Specification<Branch> hasCountry(String country) {
        return (root, query, cb) -> {
            if (country == null || country.isBlank()) return null;
            return cb.equal(cb.lower(root.get("country")), country.toLowerCase());
        };
    }

    public static Specification<Branch> searchByName(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return null;
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("city")), pattern),
                    cb.like(cb.lower(root.get("country")), pattern)
            );
        };
    }

    public static Specification<Branch> sortByField(String sortBy, String sortDirection) {
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
