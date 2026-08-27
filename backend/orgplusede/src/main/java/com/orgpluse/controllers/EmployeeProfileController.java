package com.orgpluse.controllers;

import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.EmployeeService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Scoped read-only endpoints for the Employee self-service portal.
 * Route prefix: /api/v1/employee/{employeeId}
 *
 * These endpoints intentionally expose only GET operations —
 * employees can view their own data but cannot mutate it.
 * All mutation remains under /api/v1/admin/**.
 */
@RestController
@RequestMapping("/api/v1/employee/{employeeId}")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployeeProfileController {

    @Autowired
    private EmployeeService employeeService;

    /**
     * GET /api/v1/employee/{employeeId}/profile
     * Returns the full employee record for the authenticated employee.
     * Reuses the existing EmployeeService.getEmployeeById — no duplicate logic.
     */
    @GetMapping("/profile")
    public ResponseEntity<ResponseWrapper> getMyProfile(@PathVariable Long employeeId) {
        return employeeService.getEmployeeById(employeeId);
    }

}
