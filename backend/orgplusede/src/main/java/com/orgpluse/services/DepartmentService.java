package com.orgpluse.services;

import com.orgpluse.common.PageResponse;
import com.orgpluse.common.PageableUtils;
import com.orgpluse.entities.Department;
import com.orgpluse.entities.Employee;
import com.orgpluse.exception.BadRequestException;
import com.orgpluse.exception.ResourceNotFoundException;
import com.orgpluse.repositories.DepartmentRepository;
import com.orgpluse.repositories.EmployeeRepository;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import com.orgpluse.specifications.DepartmentSpecification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class DepartmentService {

    private static final Set<String> ALLOWED_SORTS =
            Set.of("id", "name", "isActive", "createdAt");

    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private EmployeeRepository   employeeRepository;
    @Autowired private UniversalResponse    response;

    public ResponseEntity<ResponseWrapper> addDepartment(Department department) {
        Employee manager = department.getManager();
        department.setManager(null);

        if (department.getParentDepartment() != null
                && department.getParentDepartment().getId() != null) {
            Long parentId = department.getParentDepartment().getId();
            Department parent = departmentRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent department", parentId));
            department.setParentDepartment(parent);
        }

        Department saved = departmentRepository.save(department);

        if (manager != null && manager.getId() != null) {
            Employee emp = employeeRepository.findById(manager.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager (Employee)", manager.getId()));
            saved.setManager(emp);
            saved = departmentRepository.save(saved);
        }

        return response.send("Department created successfully", saved, HttpStatus.CREATED);
    }

    public ResponseEntity<ResponseWrapper> getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        return response.send("Department fetched successfully", department, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> getAllDepartments(String search, String sortBy,
                                                              String sortDirection,
                                                              Integer page, Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        return response.send("Departments fetched successfully",
                new PageResponse<>(departmentRepository.findAll(
                        DepartmentSpecification.searchByName(search), pageable)),
                HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> updateDepartment(Long id, Department updated) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));

        department.setName(updated.getName());
        department.setDescription(updated.getDescription());
        if (updated.getIsActive() != null) department.setIsActive(updated.getIsActive());

        if (updated.getManager() != null && updated.getManager().getId() != null) {
            Employee manager = employeeRepository.findById(updated.getManager().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager (Employee)",
                            updated.getManager().getId()));
            department.setManager(manager);
        } else {
            department.setManager(null);
        }

        if (updated.getParentDepartment() != null
                && updated.getParentDepartment().getId() != null) {
            Long parentId = updated.getParentDepartment().getId();
            if (parentId.equals(id))
                throw new BadRequestException("A department cannot be its own parent");
            Department parent = departmentRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent department", parentId));
            department.setParentDepartment(parent);
        } else {
            department.setParentDepartment(null);
        }

        return response.send("Department updated successfully",
                departmentRepository.save(department), HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        department.setIsActive(false);
        departmentRepository.save(department);
        return response.send("Department deactivated successfully", null, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> filterDepartments(Boolean isActive, Long managerId,
                                                              Long parentDepartmentId,
                                                              String sortBy, String sortDirection,
                                                              Integer page, Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Specification<Department> spec = Specification
                .where(DepartmentSpecification.hasIsActive(isActive))
                .and(DepartmentSpecification.hasManager(managerId))
                .and(DepartmentSpecification.hasParentDepartment(parentDepartmentId));
        return response.send("Departments filtered successfully",
                new PageResponse<>(departmentRepository.findAll(spec, pageable)), HttpStatus.OK);
    }

}
