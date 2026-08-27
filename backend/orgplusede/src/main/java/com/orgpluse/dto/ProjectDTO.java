package com.orgpluse.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProjectDTO {

    @NotBlank(message = "Project name is required")
    private String name;

    private String description;

    private LocalDate deadline;

    @NotBlank(message = "Status is required")
    private String status;

    @NotBlank(message = "Priority is required")
    private String priority;
}
