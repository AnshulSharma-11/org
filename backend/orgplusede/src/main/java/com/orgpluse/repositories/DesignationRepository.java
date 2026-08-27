package com.orgpluse.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.orgpluse.entities.Designation;

@Repository
public interface DesignationRepository extends JpaRepository<Designation, Long>,
        JpaSpecificationExecutor<Designation> {
}
