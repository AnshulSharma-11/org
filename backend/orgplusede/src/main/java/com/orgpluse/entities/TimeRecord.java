package com.orgpluse.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "time_records")
@EntityListeners(AuditingEntityListener.class)
public class TimeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Check-in time is required")
    @Column(name = "check_in", nullable = false)
    private LocalDateTime checkIn;

    @Column(name = "check_out")
    private LocalDateTime checkOut;

    @NotNull(message = "Date is required")
    @Column(nullable = false)
    private LocalDate date;

    // PRESENT / ABSENT / HALF_DAY / ON_LEAVE / WEEKEND
    @Column
    private String status;

    @Column(name = "hours_worked")
    private Double hoursWorked;

    @Column
    private String remarks;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ── Live-session fields (self check-in / break tracking) ──────────────────
    // WORKING / ON_BREAK while the employee is clocked in; null when checked out
    @Column(name = "live_status")
    private String liveStatus;

    // true when the first check-in of the day was after shift start (+ grace)
    @Column(name = "is_late")
    private Boolean late;

    @Column(name = "break_started_at")
    private LocalDateTime breakStartedAt;

    // total completed break time (seconds), deducted from hoursWorked
    @Column(name = "break_seconds")
    private Long breakSeconds;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    @JsonIgnoreProperties({"department", "designation", "branch",
            "manager", "createdAt", "updatedAt", "passwordHash"})
    private Employee employee;

}
