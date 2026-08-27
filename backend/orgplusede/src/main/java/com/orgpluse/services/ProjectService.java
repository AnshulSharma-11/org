package com.orgpluse.services;

import com.orgpluse.dto.ProjectDTO;
import com.orgpluse.entities.Employee;
import com.orgpluse.entities.Project;
import com.orgpluse.exception.ResourceNotFoundException;
import com.orgpluse.repositories.EmployeeRepository;
import com.orgpluse.repositories.ProjectRepository;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    @Autowired private ProjectRepository  projectRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private UniversalResponse  response;

    // ── READ ──────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> getAllProjects(String name,
                                                          String status,
                                                          String priority) {
        List<Project> projects;

        if (name != null && !name.isBlank()) {
            projects = projectRepository.findByNameContainingIgnoreCase(name.trim());
        } else if (status != null && !status.isBlank()) {
            projects = projectRepository.findByStatus(status);
        } else if (priority != null && !priority.isBlank()) {
            projects = projectRepository.findByPriority(priority);
        } else {
            projects = projectRepository.findAll();
        }

        return response.send("Projects fetched successfully", projects, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
        return response.send("Project fetched successfully", project, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> getProjectsByEmployeeId(Long employeeId) {
        // Verify employee exists
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        List<Project> projects = projectRepository.findByEmployeeId(employeeId);
        return response.send("Employee projects fetched successfully", projects, HttpStatus.OK);
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> createProject(ProjectDTO dto) {
        Project project = new Project();
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setDeadline(dto.getDeadline());
        project.setStatus(dto.getStatus());
        project.setPriority(dto.getPriority());

        Project saved = projectRepository.save(project);
        return response.send("Project created successfully", saved, HttpStatus.CREATED);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
        projectRepository.delete(project);
        return response.send("Project deleted successfully", null, HttpStatus.OK);
    }

    // ── ASSIGN / REMOVE EMPLOYEES ─────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> assignEmployees(Long projectId,
                                                            List<Long> employeeIds) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        for (Long empId : employeeIds) {
            Employee emp = employeeRepository.findById(empId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", empId));
            // Avoid duplicates
            boolean alreadyAssigned = project.getEmployees()
                    .stream().anyMatch(e -> e.getId().equals(empId));
            if (!alreadyAssigned) {
                project.getEmployees().add(emp);
            }
        }

        Project saved = projectRepository.save(project);
        return response.send("Employees assigned successfully", saved, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> removeEmployee(Long projectId, Long employeeId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        project.getEmployees().removeIf(e -> e.getId().equals(employeeId));
        Project saved = projectRepository.save(project);
        return response.send("Employee removed from project", saved, HttpStatus.OK);
    }
}
