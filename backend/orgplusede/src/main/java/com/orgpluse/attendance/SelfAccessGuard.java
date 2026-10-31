package com.orgpluse.attendance;

import com.orgpluse.entities.Employee;
import com.orgpluse.exception.AccessDeniedException;
import com.orgpluse.exception.AuthenticationException;
import com.orgpluse.repositories.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * Ensures an employee can only act on their own {employeeId}.
 *
 * The JWT carries the e-mail (username) and role, but the self-service URLs carry
 * the numeric employee id — without this check a logged-in employee could change
 * the id in the URL and read or punch for someone else.
 */
@Component
public class SelfAccessGuard {

    @Autowired private EmployeeRepository employeeRepository;

    public void assertSelf(Long pathEmployeeId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            throw new AuthenticationException("Authentication required");
        }
        Employee me = employeeRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("Employee account not found"));
        if (!me.getId().equals(pathEmployeeId)) {
            throw new AccessDeniedException("You can only access your own attendance");
        }
    }
}
