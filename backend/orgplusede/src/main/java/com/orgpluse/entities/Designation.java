package com.orgpluse.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity
@Data
@Table(name = "designations")
public class Designation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Designation title is required")
    @Column(nullable = false, unique = true)
    private String title;

    @NotNull(message = "Level is required")
    @Column(nullable = false)
    private Integer level;

}
