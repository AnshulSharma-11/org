package com.orgpluse.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.orgpluse.entities.Leave;

@Repository
public interface LeaveRepository extends JpaRepository<Leave, Long>,
        JpaSpecificationExecutor<Leave> {
}
