package com.orgpluse.controllers;

import com.orgpluse.entities.Department;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.DepartmentService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class DepartmentController {

    @Autowired private DepartmentService departmentService;

    @PostMapping("/departments")
    public ResponseEntity<ResponseWrapper> addDepartment(@RequestBody Department department) {
        return departmentService.addDepartment(department);
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<ResponseWrapper> updateDepartment(@PathVariable Long id,
                                                             @RequestBody Department department) {
        return departmentService.updateDepartment(id, department);
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<ResponseWrapper> deleteDepartment(@PathVariable Long id) {
        return departmentService.deleteDepartment(id);
    }

    @GetMapping("/departments/{id}")
    public ResponseEntity<ResponseWrapper> getDepartmentById(@PathVariable Long id) {
        return departmentService.getDepartmentById(id);
    }

    // GET /api/v1/admin/departments?search=&sortBy=&sortDirection=&page=0&size=20
    @GetMapping("/departments")
    public ResponseEntity<ResponseWrapper> getAllDepartments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return departmentService.getAllDepartments(search, sortBy, sortDirection, page, size);
    }

    // GET /api/v1/admin/departments/filter?isActive=&managerId=&parentDepartmentId=&page=0&size=20
    @GetMapping("/departments/filter")
    public ResponseEntity<ResponseWrapper> filterDepartments(
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Long managerId,
            @RequestParam(required = false) Long parentDepartmentId,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return departmentService.filterDepartments(isActive, managerId,
                parentDepartmentId, sortBy, sortDirection, page, size);
    }

}
