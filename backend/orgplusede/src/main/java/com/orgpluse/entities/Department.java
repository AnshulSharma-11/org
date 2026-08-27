package com.orgpluse.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Data
@Table(name = "departments")
@EntityListeners(AuditingEntityListener.class)
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Department name is required")
    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // ── Circular dependency: Department.manager → Employee
    // Employee.department → Department
    // @JsonIgnoreProperties on both sides breaks the infinite serialization loop.
    // Save order: (1) save Department with manager=null,
    //             (2) save Employee with department reference,
    //             (3) update Department.manager = savedEmployee
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    @JsonIgnoreProperties({"department", "designation", "branch", "manager", "password_hash"})
    private Employee manager;

    // ── Self-referencing parent department
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_department_id")
    @JsonIgnoreProperties({"parentDepartment", "manager", "isActive", "createdAt", "updatedAt"})
    private Department parentDepartment;

}
