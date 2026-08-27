package com.orgpluse.auth.controllers;

import com.orgpluse.auth.dto.AdminRegisterRequest;
import com.orgpluse.auth.dto.LoginRequest;
import com.orgpluse.auth.services.AdminAuthService;
import com.orgpluse.response_wrapper.ResponseWrapper;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminAuthController {

    @Autowired
    private AdminAuthService adminAuthService;

    // POST /api/v1/auth/admin/register
    @PostMapping("/register")
    public ResponseEntity<ResponseWrapper> register(
            @Valid @RequestBody AdminRegisterRequest request) {
        return adminAuthService.register(request);
    }

    // POST /api/v1/auth/admin/login
    @PostMapping("/login")
    public ResponseEntity<ResponseWrapper> login(
            @Valid @RequestBody LoginRequest request) {
        return adminAuthService.login(request);
    }

}
