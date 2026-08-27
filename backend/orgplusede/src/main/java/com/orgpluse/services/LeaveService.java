package com.orgpluse.services;

import com.orgpluse.common.PageResponse;
import com.orgpluse.common.PageableUtils;
import com.orgpluse.entities.Employee;
import com.orgpluse.entities.Leave;
import com.orgpluse.repositories.EmployeeRepository;
import com.orgpluse.exception.BadRequestException;
import com.orgpluse.exception.ResourceNotFoundException;
import com.orgpluse.repositories.LeaveRepository;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import com.orgpluse.specifications.LeaveSpecification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Set;

@Service
public class LeaveService {

    private static final Set<String> ALLOWED_SORTS =
            Set.of("id", "startDate", "endDate", "totalDays", "status", "leaveType", "createdAt");

    @Autowired private LeaveRepository    leaveRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private UniversalResponse  response;

    private int calcTotalDays(LocalDate start, LocalDate end) {
        return (int) ChronoUnit.DAYS.between(start, end) + 1;
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> addLeave(Leave leave) {
        if (leave.getEmployee() == null || leave.getEmployee().getId() == null)
            throw new BadRequestException("Employee (applicant) is required");

        Employee employee = employeeRepository.findById(leave.getEmployee().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee",
                        leave.getEmployee().getId()));
        leave.setEmployee(employee);

        if (leave.getStartDate() == null || leave.getEndDate() == null)
            throw new BadRequestException("Start date and end date are required");
        if (leave.getEndDate().isBefore(leave.getStartDate()))
            throw new BadRequestException("End date cannot be before start date");

        leave.setTotalDays(calcTotalDays(leave.getStartDate(), leave.getEndDate()));

        if (leave.getApprovedBy() != null && leave.getApprovedBy().getId() != null) {
            Employee approver = employeeRepository.findById(leave.getApprovedBy().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Approver",
                            leave.getApprovedBy().getId()));
            leave.setApprovedBy(approver);
        } else { leave.setApprovedBy(null); }

        if (leave.getStatus() == null || leave.getStatus().isBlank()) leave.setStatus("PENDING");

        Leave saved = leaveRepository.save(leave);
        return response.send("Leave application submitted successfully", saved, HttpStatus.CREATED);
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> getLeaveById(Long id) {
        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave", id));
        return response.send("Leave fetched successfully", leave, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> getAllLeaves(String sortBy,
                                                         String sortDirection,
                                                         Integer page,
                                                         Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Page<Leave> result = leaveRepository.findAll(pageable);
        return response.send("Leaves fetched successfully",
                new PageResponse<>(result), HttpStatus.OK);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> updateLeave(Long id, Leave updatedLeave) {
        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave", id));
        leave.setLeaveType(updatedLeave.getLeaveType());
        leave.setStartDate(updatedLeave.getStartDate());
        leave.setEndDate(updatedLeave.getEndDate());

        if (updatedLeave.getStartDate() != null && updatedLeave.getEndDate() != null) {
            if (updatedLeave.getEndDate().isBefore(updatedLeave.getStartDate()))
                throw new BadRequestException("End date cannot be before start date");
            leave.setTotalDays(calcTotalDays(updatedLeave.getStartDate(), updatedLeave.getEndDate()));
        }

        leave.setReason(updatedLeave.getReason());
        leave.setStatus(updatedLeave.getStatus());
        leave.setRejectionNote(updatedLeave.getRejectionNote());

        if (updatedLeave.getEmployee() != null && updatedLeave.getEmployee().getId() != null) {
            Employee emp = employeeRepository.findById(updatedLeave.getEmployee().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee",
                            updatedLeave.getEmployee().getId()));
            leave.setEmployee(emp);
        }

        if (updatedLeave.getApprovedBy() != null && updatedLeave.getApprovedBy().getId() != null) {
            Employee approver = employeeRepository.findById(updatedLeave.getApprovedBy().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Approver",
                            updatedLeave.getApprovedBy().getId()));
            leave.setApprovedBy(approver);
        } else { leave.setApprovedBy(null); }

        Leave saved = leaveRepository.save(leave);
        return response.send("Leave updated successfully", saved, HttpStatus.OK);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> deleteLeave(Long id) {
        if (!leaveRepository.existsById(id))
            throw new ResourceNotFoundException("Leave", id);
        leaveRepository.deleteById(id);
        return response.send("Leave deleted successfully", null, HttpStatus.OK);
    }

    // ── FILTER ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> filterLeaves(Long employeeId,
                                                         String status,
                                                         String leaveType,
                                                         LocalDate startDate,
                                                         LocalDate endDate,
                                                         Long approvedById,
                                                         String sortBy,
                                                         String sortDirection,
                                                         Integer page,
                                                         Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Specification<Leave> spec = Specification
                .where(LeaveSpecification.hasEmployee(employeeId))
                .and(LeaveSpecification.hasStatus(status))
                .and(LeaveSpecification.hasLeaveType(leaveType))
                .and(LeaveSpecification.startDateFrom(startDate))
                .and(LeaveSpecification.endDateTo(endDate))
                .and(LeaveSpecification.hasApprovedBy(approvedById));
        Page<Leave> result = leaveRepository.findAll(spec, pageable);
        return response.send("Leaves filtered successfully",
                new PageResponse<>(result), HttpStatus.OK);
    }

}
