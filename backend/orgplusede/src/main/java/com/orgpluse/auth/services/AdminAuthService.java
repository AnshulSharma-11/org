package com.orgpluse.auth.services;

import com.orgpluse.auth.dto.AdminLoginResponse;
import com.orgpluse.auth.dto.AdminRegisterRequest;
import com.orgpluse.auth.dto.LoginRequest;
import com.orgpluse.auth.entities.Admin;
import com.orgpluse.auth.repositories.AdminRepository;
import com.orgpluse.exception.AccessDeniedException;
import com.orgpluse.exception.AuthenticationException;
import com.orgpluse.exception.DuplicateResourceException;
import com.orgpluse.jwt.JwtTokenGenerator;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import com.orgpluse.services.OrgpluseUserDetailsService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AdminAuthService {

    @Autowired private AdminRepository adminRepository;
    @Autowired private UniversalResponse response;
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtTokenGenerator jwtTokenGenerator;
    @Autowired private OrgpluseUserDetailsService userDetailsService;

    // ── REGISTER ──────────────────────────────────────────────────────────────
    public ResponseEntity<ResponseWrapper> register(AdminRegisterRequest request) {

        if (adminRepository.existsByEmail(request.getEmail()))
            throw new DuplicateResourceException(
                    "An admin with this email already exists: " + request.getEmail());

        Admin admin = new Admin();
        admin.setFullName(request.getFullName());
        admin.setEmail(request.getEmail());
        admin.setPasswordHash(PasswordUtil.hash(request.getPassword()));
        admin.setStatus("ACTIVE");

        Admin saved = adminRepository.save(admin);
        return response.send("Admin registered successfully",
                toResponse(saved, null), HttpStatus.CREATED);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    public ResponseEntity<ResponseWrapper> login(LoginRequest request) {

        // Let Spring Security + BCrypt do the password check
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new AuthenticationException("Invalid email or password");
        }

        Optional<Admin> adminOpt = adminRepository.findByEmail(request.getEmail());
        if (adminOpt.isEmpty())
            throw new AuthenticationException("Invalid email or password");

        Admin admin = adminOpt.get();

        if (!"ACTIVE".equalsIgnoreCase(admin.getStatus()))
            throw new AccessDeniedException("Admin account is inactive");

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtTokenGenerator.generateToken(userDetails, "ROLE_ADMIN");

        return response.send("Admin login successful",
                toResponse(admin, token), HttpStatus.OK);
    }

    // ── HELPER ────────────────────────────────────────────────────────────────
    private AdminLoginResponse toResponse(Admin admin, String token) {
        return new AdminLoginResponse(
                admin.getId(),
                admin.getFullName(),
                admin.getEmail(),
                admin.getStatus(),
                "ROLE_ADMIN",
                token);
    }
}
