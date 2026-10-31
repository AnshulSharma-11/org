package com.orgpluse.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.orgpluse.entities.TimeRecord;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeRecordRepository extends JpaRepository<TimeRecord, Long>,
        JpaSpecificationExecutor<TimeRecord> {

    Optional<TimeRecord> findByEmployee_IdAndDate(Long employeeId, LocalDate date);

    /** Duplicate-safe variant used by the self check-in flow. */
    Optional<TimeRecord> findFirstByEmployee_IdAndDateOrderByIdAsc(Long employeeId, LocalDate date);

    /** Sessions still marked WORKING / ON_BREAK on an earlier day (forgot to check out). */
    List<TimeRecord> findByEmployee_IdAndDateBeforeAndLiveStatusIsNotNull(Long employeeId, LocalDate date);

    /** One day, with employee + department + designation fetched (no N+1). */
    @Query("select t from TimeRecord t join fetch t.employee e "
         + "left join fetch e.department left join fetch e.designation "
         + "where t.date = :day")
    List<TimeRecord> findDetailedByDate(@Param("day") LocalDate day);

    /** Date range, with employee + department + designation fetched (no N+1). */
    @Query("select t from TimeRecord t join fetch t.employee e "
         + "left join fetch e.department left join fetch e.designation "
         + "where t.date between :rangeStart and :rangeEnd order by t.date asc, t.id asc")
    List<TimeRecord> findDetailedBetween(@Param("rangeStart") LocalDate rangeStart, @Param("rangeEnd") LocalDate rangeEnd);
}
