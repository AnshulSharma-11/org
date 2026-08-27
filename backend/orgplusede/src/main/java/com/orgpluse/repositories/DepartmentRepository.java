package com.orgpluse.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.orgpluse.entities.Department;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long>,
        JpaSpecificationExecutor<Department> {
}
