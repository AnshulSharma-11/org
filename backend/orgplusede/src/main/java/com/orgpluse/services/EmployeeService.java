package com.orgpluse.services;

import com.orgpluse.common.PageResponse;
import com.orgpluse.common.PageableUtils;
import com.orgpluse.entities.*;
import com.orgpluse.exception.BadRequestException;
import com.orgpluse.exception.ResourceNotFoundException;
import com.orgpluse.repositories.*;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import com.orgpluse.specifications.EmployeeSpecification;
import com.orgpluse.auth.services.PasswordUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class EmployeeService {

    private static final Set<String> ALLOWED_SORTS = Set.of(
            "id", "firstName", "lastName", "email", "employeeCode",
            "status", "hireDate", "createdAt");

    @Autowired private EmployeeRepository    employeeRepository;
    @Autowired private DepartmentRepository  departmentRepository;
    @Autowired private DesignationRepository designationRepository;
    @Autowired private BranchRepository      branchRepository;
    @Autowired private UniversalResponse     response;

    public ResponseEntity<ResponseWrapper> addEmployee(Employee employee) {
        if (employee.getPasswordHash() != null && !employee.getPasswordHash().trim().isEmpty()) {
            employee.setPasswordHash(PasswordUtil.hash(employee.getPasswordHash()));
        }
        resolveFKs(employee);
        return response.send("Employee created successfully",
                employeeRepository.save(employee), HttpStatus.CREATED);
    }

    public ResponseEntity<ResponseWrapper> getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        return response.send("Employee fetched successfully", employee, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> getAllEmployees(String search, String sortBy,
                                                            String sortDirection,
                                                            Integer page, Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Specification<Employee> spec = EmployeeSpecification.searchByNameOrEmailOrCode(search);
        Page<Employee> result = employeeRepository.findAll(spec, pageable);
        return response.send("Employees fetched successfully",
                new PageResponse<>(result), HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> updateEmployee(Long id, Employee updatedEmployee) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));

        employee.setEmployeeCode(updatedEmployee.getEmployeeCode());
        employee.setFirstName(updatedEmployee.getFirstName());
        employee.setLastName(updatedEmployee.getLastName());
        employee.setEmail(updatedEmployee.getEmail());
        
        if (updatedEmployee.getPasswordHash() != null && !updatedEmployee.getPasswordHash().trim().isEmpty()) {
            employee.setPasswordHash(PasswordUtil.hash(updatedEmployee.getPasswordHash()));
        }

        employee.setPhone(updatedEmployee.getPhone());
        employee.setDob(updatedEmployee.getDob());
        employee.setGender(updatedEmployee.getGender());
        employee.setAddress(updatedEmployee.getAddress());
        employee.setHireDate(updatedEmployee.getHireDate());
        employee.setTerminationDate(updatedEmployee.getTerminationDate());
        employee.setStatus(updatedEmployee.getStatus());

        // Resolve manager with self-reference guard
        if (updatedEmployee.getManager() != null
                && updatedEmployee.getManager().getId() != null) {
            if (updatedEmployee.getManager().getId().equals(id))
                throw new BadRequestException("An employee cannot be their own manager");
            Employee manager = employeeRepository.findById(updatedEmployee.getManager().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager (Employee)",
                            updatedEmployee.getManager().getId()));
            employee.setManager(manager);
        } else { employee.setManager(null); }

        // Resolve other FKs
        if (updatedEmployee.getDepartment() != null
                && updatedEmployee.getDepartment().getId() != null) {
            employee.setDepartment(departmentRepository
                    .findById(updatedEmployee.getDepartment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department",
                            updatedEmployee.getDepartment().getId())));
        } else { employee.setDepartment(null); }

        if (updatedEmployee.getDesignation() != null
                && updatedEmployee.getDesignation().getId() != null) {
            employee.setDesignation(designationRepository
                    .findById(updatedEmployee.getDesignation().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Designation",
                            updatedEmployee.getDesignation().getId())));
        } else { employee.setDesignation(null); }

        if (updatedEmployee.getBranch() != null
                && updatedEmployee.getBranch().getId() != null) {
            employee.setBranch(branchRepository
                    .findById(updatedEmployee.getBranch().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch",
                            updatedEmployee.getBranch().getId())));
        } else { employee.setBranch(null); }

        return response.send("Employee updated successfully",
                employeeRepository.save(employee), HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id))
            throw new ResourceNotFoundException("Employee", id);
        employeeRepository.deleteById(id);
        return response.send("Employee deleted successfully", null, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> filterEmployees(String search, Long departmentId,
                                                            Long designationId, Long branchId,
                                                            String status, String gender,
                                                            Long managerId, String sortBy,
                                                            String sortDirection,
                                                            Integer page, Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Specification<Employee> spec = Specification
                .where(EmployeeSpecification.searchByNameOrEmailOrCode(search))
                .and(EmployeeSpecification.hasDepartment(departmentId))
                .and(EmployeeSpecification.hasDesignation(designationId))
                .and(EmployeeSpecification.hasBranch(branchId))
                .and(EmployeeSpecification.hasStatus(status))
                .and(EmployeeSpecification.hasGender(gender))
                .and(EmployeeSpecification.hasManager(managerId));
        return response.send("Employees filtered successfully",
                new PageResponse<>(employeeRepository.findAll(spec, pageable)), HttpStatus.OK);
    }

    // ── private FK resolver ───────────────────────────────────────────────────

    private void resolveFKs(Employee employee) {
        if (employee.getDepartment() != null && employee.getDepartment().getId() != null)
            employee.setDepartment(departmentRepository
                    .findById(employee.getDepartment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department",
                            employee.getDepartment().getId())));

        if (employee.getDesignation() != null && employee.getDesignation().getId() != null)
            employee.setDesignation(designationRepository
                    .findById(employee.getDesignation().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Designation",
                            employee.getDesignation().getId())));

        if (employee.getBranch() != null && employee.getBranch().getId() != null)
            employee.setBranch(branchRepository
                    .findById(employee.getBranch().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch",
                            employee.getBranch().getId())));

        if (employee.getManager() != null && employee.getManager().getId() != null)
            employee.setManager(employeeRepository
                    .findById(employee.getManager().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager (Employee)",
                            employee.getManager().getId())));
    }

}
