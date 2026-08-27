package com.orgpluse.services;

import com.orgpluse.auth.entities.Admin;
import com.orgpluse.auth.repositories.AdminRepository;
import com.orgpluse.entities.Employee;
import com.orgpluse.repositories.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * OrgpluseUserDetailsService
 *
 * The bridge between ORGPLUSE entities (Admin, Employee) and
 * Spring Security's UserDetails interface.
 *
 * Username in ORGPLUSE = email address.
 * Lookup order: Admin first, then Employee.
 * Role strings: "ROLE_ADMIN" / "ROLE_EMPLOYEE" — Spring convention.
 */
@Service
public class OrgpluseUserDetailsService implements UserDetailsService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        // ── Try Admin first ───────────────────────────────────────────────────
        Optional<Admin> adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            return new User(
                    admin.getEmail(),
                    admin.getPasswordHash(),
                    List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
        }

        // ── Try Employee ──────────────────────────────────────────────────────
        Optional<Employee> empOpt = employeeRepository.findByEmail(email);
        if (empOpt.isPresent()) {
            Employee employee = empOpt.get();
            return new User(
                    employee.getEmail(),
                    employee.getPasswordHash(),
                    List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
            );
        }

        throw new UsernameNotFoundException("No user found with email: " + email);
    }
}
