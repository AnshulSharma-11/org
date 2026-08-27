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
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "performance_reviews")
@EntityListeners(AuditingEntityListener.class)
public class PerformanceReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Cycle name is required")
    @Column(name = "cycle_name", nullable = false)
    private String cycleName;

    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    // JSON string — e.g. {"communication":4,"delivery":5,"teamwork":3}
    @Column(name = "criteria_ratings", columnDefinition = "TEXT")
    private String criteriaRatings;

    @Column(name = "overall_rating")
    private Float overallRating;

    // PENDING / IN_PROGRESS / COMPLETED
    @Column(nullable = false)
    private String status;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // ── Employee being reviewed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"department", "designation", "branch",
            "manager", "createdAt", "updatedAt", "passwordHash"})
    private Employee employee;

    // ── Employee conducting the review
    // Ignore deeper nested fields to prevent Employee → PerformanceReview → Employee recursion
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    @JsonIgnoreProperties({"subordinates", "department", "designation",
            "branch", "manager", "createdAt", "updatedAt", "passwordHash"})
    private Employee reviewer;

}
