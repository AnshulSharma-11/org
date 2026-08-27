package com.orgpluse.services;

import com.orgpluse.common.PageResponse;
import com.orgpluse.common.PageableUtils;
import com.orgpluse.entities.Department;
import com.orgpluse.entities.Employee;
import com.orgpluse.entities.Help;
import com.orgpluse.repositories.DepartmentRepository;
import com.orgpluse.repositories.EmployeeRepository;
import com.orgpluse.exception.BadRequestException;
import com.orgpluse.exception.ResourceNotFoundException;
import com.orgpluse.repositories.HelpRepository;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import com.orgpluse.specifications.HelpSpecification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

@Service
public class HelpService {

    private static final Set<String> ALLOWED_SORTS =
            Set.of("id", "priority", "status", "requestType", "createdAt", "resolvedAt");

    @Autowired private HelpRepository       helpRepository;
    @Autowired private EmployeeRepository   employeeRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private UniversalResponse    response;

    // ── FK resolution ─────────────────────────────────────────────────────────

    private void resolveFKs(Help help) {
        if (help.getEmployee() == null || help.getEmployee().getId() == null)
            throw new BadRequestException("Employee is required");

        Employee employee = employeeRepository.findById(help.getEmployee().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee",
                        help.getEmployee().getId()));
        help.setEmployee(employee);

        if (help.getAssignedTo() != null && help.getAssignedTo().getId() != null) {
            Employee assignee = employeeRepository.findById(help.getAssignedTo().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned employee",
                            help.getAssignedTo().getId()));
            help.setAssignedTo(assignee);
        } else { help.setAssignedTo(null); }

        if (help.getCurrentDepartment() != null && help.getCurrentDepartment().getId() != null) {
            Department dept = departmentRepository.findById(help.getCurrentDepartment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Current department",
                            help.getCurrentDepartment().getId()));
            help.setCurrentDepartment(dept);
        } else { help.setCurrentDepartment(null); }

        if (help.getRequestedDepartment() != null && help.getRequestedDepartment().getId() != null) {
            Department reqDept = departmentRepository.findById(help.getRequestedDepartment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Requested department",
                            help.getRequestedDepartment().getId()));
            help.setRequestedDepartment(reqDept);
        } else { help.setRequestedDepartment(null); }

    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> addHelp(Help help) {
        resolveFKs(help);
        if (help.getStatus() == null || help.getStatus().isBlank()) help.setStatus("OPEN");
        Help saved = helpRepository.save(help);
        return response.send("Help request submitted successfully", saved, HttpStatus.CREATED);
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> getHelpById(Long id) {
        Help help = helpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Help request", id));
        return response.send("Help request fetched successfully", help, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> getAllHelp(String search,
                                                       String sortBy,
                                                       String sortDirection,
                                                       Integer page,
                                                       Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Specification<Help> spec = HelpSpecification.searchBySubject(search);
        Page<Help> result = helpRepository.findAll(spec, pageable);
        return response.send("Help requests fetched successfully",
                new PageResponse<>(result), HttpStatus.OK);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> updateHelp(Long id, Help updatedHelp) {
        Help help = helpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Help request", id));
        help.setRequestType(updatedHelp.getRequestType());
        help.setSubject(updatedHelp.getSubject());
        help.setDescription(updatedHelp.getDescription());
        help.setPriority(updatedHelp.getPriority());
        help.setResolutionNotes(updatedHelp.getResolutionNotes());

        String newStatus = updatedHelp.getStatus();
        help.setStatus(newStatus);
        if (("RESOLVED".equalsIgnoreCase(newStatus) || "CLOSED".equalsIgnoreCase(newStatus))
                && help.getResolvedAt() == null) {
            help.setResolvedAt(LocalDateTime.now());
        }

        resolveFKs(updatedHelp);

        help.setEmployee(updatedHelp.getEmployee());
        help.setAssignedTo(updatedHelp.getAssignedTo());
        help.setCurrentDepartment(updatedHelp.getCurrentDepartment());
        help.setRequestedDepartment(updatedHelp.getRequestedDepartment());

        Help saved = helpRepository.save(help);
        return response.send("Help request updated successfully", saved, HttpStatus.OK);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> deleteHelp(Long id) {
        if (!helpRepository.existsById(id))
            throw new ResourceNotFoundException("Help request", id);
        helpRepository.deleteById(id);
        return response.send("Help request deleted successfully", null, HttpStatus.OK);
    }

    // ── FILTER ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> filterHelp(String requestType,
                                                       String status,
                                                       String priority,
                                                       Long employeeId,
                                                       Long assignedToId,
                                                       Long currentDepartmentId,
                                                       Long requestedDepartmentId,
                                                       String search,
                                                       String sortBy,
                                                       String sortDirection,
                                                       Integer page,
                                                       Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Specification<Help> spec = Specification
                .where(HelpSpecification.hasRequestType(requestType))
                .and(HelpSpecification.hasStatus(status))
                .and(HelpSpecification.hasPriority(priority))
                .and(HelpSpecification.hasEmployee(employeeId))
                .and(HelpSpecification.hasAssignedTo(assignedToId))
                .and(HelpSpecification.hasCurrentDepartment(currentDepartmentId))
                .and(HelpSpecification.hasRequestedDepartment(requestedDepartmentId))
                .and(HelpSpecification.searchBySubject(search));
        Page<Help> result = helpRepository.findAll(spec, pageable);
        return response.send("Help requests filtered successfully",
                new PageResponse<>(result), HttpStatus.OK);
    }

}
