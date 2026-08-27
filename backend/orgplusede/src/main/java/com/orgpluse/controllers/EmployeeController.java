package com.orgpluse.controllers;

import com.orgpluse.entities.Employee;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.EmployeeService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployeeController {

    @Autowired private EmployeeService employeeService;

    @PostMapping("/employees")
    public ResponseEntity<ResponseWrapper> addEmployee(@RequestBody Employee employee) {
        return employeeService.addEmployee(employee);
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<ResponseWrapper> updateEmployee(@PathVariable Long id,
                                                           @RequestBody Employee employee) {
        return employeeService.updateEmployee(id, employee);
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<ResponseWrapper> deleteEmployee(@PathVariable Long id) {
        return employeeService.deleteEmployee(id);
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<ResponseWrapper> getEmployeeById(@PathVariable Long id) {
        return employeeService.getEmployeeById(id);
    }

    // GET /api/v1/admin/employees?search=&sortBy=&sortDirection=&page=0&size=20
    @GetMapping("/employees")
    public ResponseEntity<ResponseWrapper> getAllEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return employeeService.getAllEmployees(search, sortBy, sortDirection, page, size);
    }

    // GET /api/v1/admin/employees/filter?search=&departmentId=&...&page=0&size=20
    @GetMapping("/employees/filter")
    public ResponseEntity<ResponseWrapper> filterEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long designationId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Long managerId,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return employeeService.filterEmployees(
                search, departmentId, designationId, branchId,
                status, gender, managerId, sortBy, sortDirection, page, size);
    }

}
