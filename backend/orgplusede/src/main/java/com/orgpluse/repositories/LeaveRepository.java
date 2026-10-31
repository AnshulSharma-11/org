package com.orgpluse.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.orgpluse.entities.Leave;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRepository extends JpaRepository<Leave, Long>,
        JpaSpecificationExecutor<Leave> {

    /** True if the employee has an APPROVED leave covering the given date. */
    @Query("select count(l) from Leave l where l.employee.id = :employeeId "
         + "and upper(l.status) = 'APPROVED' and l.startDate <= :day and l.endDate >= :day")
    long countApprovedOn(@Param("employeeId") Long employeeId, @Param("day") LocalDate day);

    default boolean existsApprovedOn(Long employeeId, LocalDate day) {
        return countApprovedOn(employeeId, day) > 0;
    }

    /** APPROVED leaves overlapping [from, to], with employee + department fetched. */
    @Query("select l from Leave l join fetch l.employee e left join fetch e.department "
         + "where upper(l.status) = 'APPROVED' and l.startDate <= :rangeEnd and l.endDate >= :rangeStart")
    List<Leave> findApprovedOverlapping(@Param("rangeStart") LocalDate rangeStart, @Param("rangeEnd") LocalDate rangeEnd);
}
