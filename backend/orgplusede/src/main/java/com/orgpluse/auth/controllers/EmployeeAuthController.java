package com.orgpluse.auth.controllers;

import com.orgpluse.auth.dto.EmployeeRegisterRequest;
import com.orgpluse.auth.dto.LoginRequest;
import com.orgpluse.auth.services.EmployeeAuthService;
import com.orgpluse.response_wrapper.ResponseWrapper;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/employee")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployeeAuthController {

    @Autowired
    private EmployeeAuthService employeeAuthService;

    // POST /api/v1/auth/employee/register
    @PostMapping("/register")
    public ResponseEntity<ResponseWrapper> register(
            @Valid @RequestBody EmployeeRegisterRequest request) {
        return employeeAuthService.register(request);
    }

    // POST /api/v1/auth/employee/login
    @PostMapping("/login")
    public ResponseEntity<ResponseWrapper> login(
            @Valid @RequestBody LoginRequest request) {
        return employeeAuthService.login(request);
    }

}
