package com.orgpluse.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.orgpluse.entities.PayrollRun;

@Repository
public interface PayrollRunRepository extends JpaRepository<PayrollRun, Long>,
        JpaSpecificationExecutor<PayrollRun> {
}
