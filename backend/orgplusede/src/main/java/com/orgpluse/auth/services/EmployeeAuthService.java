package com.orgpluse.auth.services;

import com.orgpluse.auth.dto.EmployeeLoginResponse;
import com.orgpluse.auth.dto.EmployeeRegisterRequest;
import com.orgpluse.auth.dto.LoginRequest;
import com.orgpluse.entities.Branch;
import com.orgpluse.entities.Department;
import com.orgpluse.entities.Designation;
import com.orgpluse.entities.Employee;
import com.orgpluse.repositories.BranchRepository;
import com.orgpluse.repositories.DepartmentRepository;
import com.orgpluse.repositories.DesignationRepository;
import com.orgpluse.repositories.EmployeeRepository;
import com.orgpluse.exception.AccessDeniedException;
import com.orgpluse.exception.AuthenticationException;
import com.orgpluse.exception.DuplicateResourceException;
import com.orgpluse.exception.ResourceNotFoundException;
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
public class EmployeeAuthService {

    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private DesignationRepository designationRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private UniversalResponse response;
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtTokenGenerator jwtTokenGenerator;
    @Autowired private OrgpluseUserDetailsService userDetailsService;

    // ── REGISTER ──────────────────────────────────────────────────────────────
    public ResponseEntity<ResponseWrapper> register(EmployeeRegisterRequest request) {

        if (employeeRepository.existsByEmail(request.getEmail()))
            throw new DuplicateResourceException(
                    "An employee with this email already exists: " + request.getEmail());

        if (employeeRepository.existsByEmployeeCode(request.getEmployeeCode()))
            throw new DuplicateResourceException(
                    "An employee with this code already exists: " + request.getEmployeeCode());

        Employee employee = new Employee();
        employee.setEmployeeCode(request.getEmployeeCode());
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setPasswordHash(PasswordUtil.hash(request.getPassword()));
        employee.setPhone(request.getPhone());
        employee.setHireDate(request.getHireDate());
        employee.setStatus(request.getStatus());
        employee.setDob(request.getDob());
        employee.setGender(request.getGender());
        employee.setAddress(request.getAddress());

        if (request.getDepartmentId() != null) {
            Optional<Department> dept = departmentRepository.findById(request.getDepartmentId());
            if (dept.isEmpty()) throw new ResourceNotFoundException("Department", request.getDepartmentId());
            employee.setDepartment(dept.get());
        }
        if (request.getDesignationId() != null) {
            Optional<Designation> desig = designationRepository.findById(request.getDesignationId());
            if (desig.isEmpty()) throw new ResourceNotFoundException("Designation", request.getDesignationId());
            employee.setDesignation(desig.get());
        }
        if (request.getBranchId() != null) {
            Optional<Branch> branch = branchRepository.findById(request.getBranchId());
            if (branch.isEmpty()) throw new ResourceNotFoundException("Branch", request.getBranchId());
            employee.setBranch(branch.get());
        }
        if (request.getManagerId() != null) {
            Optional<Employee> manager = employeeRepository.findById(request.getManagerId());
            if (manager.isEmpty()) throw new ResourceNotFoundException("Manager (Employee)", request.getManagerId());
            employee.setManager(manager.get());
        }

        Employee saved = employeeRepository.save(employee);
        return response.send("Employee registered successfully",
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

        Optional<Employee> employeeOpt = employeeRepository.findByEmail(request.getEmail());
        if (employeeOpt.isEmpty())
            throw new AuthenticationException("Invalid email or password");

        Employee employee = employeeOpt.get();

        if (!"ACTIVE".equalsIgnoreCase(employee.getStatus()))
            throw new AccessDeniedException("Employee account is inactive");

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtTokenGenerator.generateToken(userDetails, "ROLE_EMPLOYEE");

        return response.send("Employee login successful",
                toResponse(employee, token), HttpStatus.OK);
    }

    // ── HELPER ────────────────────────────────────────────────────────────────
    private EmployeeLoginResponse toResponse(Employee employee, String token) {
        return new EmployeeLoginResponse(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getPhone(),
                employee.getStatus(),
                "ROLE_EMPLOYEE",
                token);
    }
}
