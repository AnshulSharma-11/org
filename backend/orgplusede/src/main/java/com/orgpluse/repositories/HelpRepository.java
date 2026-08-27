package com.orgpluse.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.orgpluse.entities.Help;

@Repository
public interface HelpRepository extends JpaRepository<Help, Long>,
        JpaSpecificationExecutor<Help> {
}
