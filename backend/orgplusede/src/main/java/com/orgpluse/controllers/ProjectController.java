package com.orgpluse.controllers;

import com.orgpluse.dto.ProjectDTO;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.ProjectService;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class ProjectController {

    @Autowired private ProjectService projectService;

    // ── Admin endpoints ───────────────────────────────────────────────────────

    // GET /api/v1/admin/projects?name=&status=&priority=
    @GetMapping("/api/v1/admin/projects")
    public ResponseEntity<ResponseWrapper> getAllProjects(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {
        return projectService.getAllProjects(name, status, priority);
    }

    // POST /api/v1/admin/projects
    @PostMapping("/api/v1/admin/projects")
    public ResponseEntity<ResponseWrapper> createProject(
            @Valid @RequestBody ProjectDTO dto) {
        return projectService.createProject(dto);
    }

    // DELETE /api/v1/admin/projects/{id}
    @DeleteMapping("/api/v1/admin/projects/{id}")
    public ResponseEntity<ResponseWrapper> deleteProject(@PathVariable Long id) {
        return projectService.deleteProject(id);
    }

    // POST /api/v1/admin/projects/{id}/employees
    // Body: { "employeeIds": [1, 2, 3] }
    @PostMapping("/api/v1/admin/projects/{id}/employees")
    public ResponseEntity<ResponseWrapper> assignEmployees(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> body) {
        List<Long> employeeIds = body.get("employeeIds");
        return projectService.assignEmployees(id, employeeIds);
    }

    // DELETE /api/v1/admin/projects/{id}/employees/{empId}
    @DeleteMapping("/api/v1/admin/projects/{id}/employees/{empId}")
    public ResponseEntity<ResponseWrapper> removeEmployee(
            @PathVariable Long id,
            @PathVariable Long empId) {
        return projectService.removeEmployee(id, empId);
    }

    // ── Employee self-service endpoint ────────────────────────────────────────

    // GET /api/v1/employee/{employeeId}/projects
    @GetMapping("/api/v1/employee/{employeeId}/projects")
    public ResponseEntity<ResponseWrapper> getMyProjects(
            @PathVariable Long employeeId) {
        return projectService.getProjectsByEmployeeId(employeeId);
    }
}
