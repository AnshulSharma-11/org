package com.orgpluse.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "help_requests")
@EntityListeners(AuditingEntityListener.class)
public class Help {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // COMPLAINT / DEPARTMENT_CHANGE / DESIGNATION_CHANGE / PAYROLL_ISSUE /
    // ATTENDANCE_ISSUE / LEAVE_ISSUE / GENERAL_SUPPORT / TECHNICAL_SUPPORT
    @NotBlank(message = "Request type is required")
    @Column(name = "request_type", nullable = false)
    private String requestType;

    @NotBlank(message = "Subject is required")
    @Size(max = 200, message = "Subject must not exceed 200 characters")
    @Column(nullable = false, length = 200)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String description;

    // OPEN / IN_PROGRESS / APPROVED / REJECTED / RESOLVED / CLOSED
    @Column(nullable = false)
    private String status;

    // LOW / MEDIUM / HIGH / CRITICAL
    @NotBlank(message = "Priority is required")
    @Column(nullable = false)
    private String priority;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // ── Employee who raised the help request (required)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"department", "designation", "branch",
            "manager", "createdAt", "updatedAt", "passwordHash"})
    private Employee employee;

    // ── HR / Admin employee handling this request (nullable until assigned)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    @JsonIgnoreProperties({"subordinates", "department", "designation",
            "branch", "manager", "createdAt", "updatedAt", "passwordHash"})
    private Employee assignedTo;

    // ── Employee's current department (relevant for DEPARTMENT_CHANGE requests)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_department_id")
    @JsonIgnoreProperties({"manager", "parentDepartment", "employees", "createdAt", "updatedAt"})
    private Department currentDepartment;

    // ── Department the employee is requesting a transfer to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_department_id")
    @JsonIgnoreProperties({"manager", "parentDepartment", "employees", "createdAt", "updatedAt"})
    private Department requestedDepartment;

}
