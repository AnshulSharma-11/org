package com.orgpluse.repositories;

import com.orgpluse.entities.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>,
        JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmployeeCode(String employeeCode);

    /**
     * DB-level status filter — used by bulk payroll instead of
     * findAll().stream().filter(e -> e.getStatus().equals("ACTIVE")).
     *
     * Performance benefit: MySQL applies the WHERE status = ? predicate
     * before sending any data across the JDBC wire.  With 5,000 employees
     * and 4,000 ACTIVE, the old stream() approach:
     *   - Fetched all 5,000 rows from DB → Java heap
     *   - Iterated all 5,000 objects in Java
     *   - Discarded 1,000 INACTIVE objects
     * This method fetches only the 4,000 ACTIVE rows; the 1,000 rows
     * are never read from disk, never transferred over JDBC, and never
     * allocated on the heap.
     */
    List<Employee> findByStatusIgnoreCase(String status);

}
