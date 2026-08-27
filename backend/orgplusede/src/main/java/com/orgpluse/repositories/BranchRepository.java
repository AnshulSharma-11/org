package com.orgpluse.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.orgpluse.entities.Branch;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long>,
        JpaSpecificationExecutor<Branch> {
}
