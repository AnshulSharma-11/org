package com.orgpluse.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "leaves")
@EntityListeners(AuditingEntityListener.class)
public class Leave {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // SICK / CASUAL / EARNED / MATERNITY / UNPAID
    @NotBlank(message = "Leave type is required")
    @Column(name = "leave_type", nullable = false)
    private String leaveType;

    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "total_days", nullable = false)
    private Integer totalDays;

    @Column(columnDefinition = "TEXT")
    private String reason;

    // PENDING / APPROVED / REJECTED
    @Column(nullable = false)
    private String status;

    @Column(name = "rejection_note")
    private String rejectionNote;

    @CreatedDate
    @Column(name = "applied_at", updatable = false)
    private Instant appliedAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // ── Employee who applied for the leave
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"department", "designation", "branch",
            "manager", "createdAt", "updatedAt", "passwordHash"})
    private Employee employee;

    // ── Employee (manager/HR) who approved or rejected — nullable
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    @JsonIgnoreProperties({"subordinates", "department", "designation",
            "branch", "manager", "createdAt", "updatedAt", "passwordHash"})
    private Employee approvedBy;

}
