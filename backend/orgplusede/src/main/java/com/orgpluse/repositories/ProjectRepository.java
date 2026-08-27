package com.orgpluse.repositories;

import com.orgpluse.entities.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByStatus(String status);

    List<Project> findByPriority(String priority);

    List<Project> findByNameContainingIgnoreCase(String name);

    @Query("SELECT p FROM Project p JOIN p.employees e WHERE e.id = :employeeId")
    List<Project> findByEmployeeId(@Param("employeeId") Long employeeId);
}
