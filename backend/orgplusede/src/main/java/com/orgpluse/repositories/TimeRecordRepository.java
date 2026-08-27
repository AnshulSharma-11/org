package com.orgpluse.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.orgpluse.entities.TimeRecord;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface TimeRecordRepository extends JpaRepository<TimeRecord, Long>,
        JpaSpecificationExecutor<TimeRecord> {

    Optional<TimeRecord> findByEmployee_IdAndDate(Long employeeId, LocalDate date);
}
