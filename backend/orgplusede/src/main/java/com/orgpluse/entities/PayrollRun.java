package com.orgpluse.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
@Table(name = "payroll_runs")
@EntityListeners(AuditingEntityListener.class)
public class PayrollRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    @Column(nullable = false)
    private Integer month;

    @NotNull(message = "Year is required")
    @Column(nullable = false)
    private Integer year;

    @NotNull(message = "Run date is required")
    @Column(name = "run_date", nullable = false)
    private LocalDate runDate;

    // DRAFT / PROCESSED / APPROVED / PAID
    @Column(nullable = false)
    private String status;

    // Serialized JSON string — stores full payslip breakdown
    @Column(name = "payslip_data", columnDefinition = "TEXT")
    private String payslipData;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(name = "transaction_id")
    private String transactionId;

    // ── Employee whose payslip this record belongs to (required)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"department", "designation", "branch",
            "manager", "createdAt", "updatedAt", "passwordHash"})
    private Employee employee;

    // ── HR / Finance employee who ran this payroll (optional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    @JsonIgnoreProperties({"department", "designation", "branch",
            "manager", "createdAt", "updatedAt", "passwordHash"})
    private Employee processedBy;

}
