package com.orgpluse.controllers;

import com.orgpluse.entities.Help;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.HelpService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class HelpController {

    @Autowired private HelpService helpService;

    @PostMapping("/help")
    public ResponseEntity<ResponseWrapper> addHelp(@RequestBody Help help) {
        return helpService.addHelp(help);
    }

    @PutMapping("/help/{id}")
    public ResponseEntity<ResponseWrapper> updateHelp(@PathVariable Long id,
                                                       @RequestBody Help help) {
        return helpService.updateHelp(id, help);
    }

    @DeleteMapping("/help/{id}")
    public ResponseEntity<ResponseWrapper> deleteHelp(@PathVariable Long id) {
        return helpService.deleteHelp(id);
    }

    @GetMapping("/help/{id}")
    public ResponseEntity<ResponseWrapper> getHelpById(@PathVariable Long id) {
        return helpService.getHelpById(id);
    }

    // GET /api/v1/admin/help?search=&sortBy=&sortDirection=&page=0&size=20
    @GetMapping("/help")
    public ResponseEntity<ResponseWrapper> getAllHelp(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return helpService.getAllHelp(search, sortBy, sortDirection, page, size);
    }

    // GET /api/v1/admin/help/filter?requestType=&status=&priority=&...&page=0&size=20
    @GetMapping("/help/filter")
    public ResponseEntity<ResponseWrapper> filterHelp(
            @RequestParam(required = false) String requestType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long assignedTo,
            @RequestParam(required = false) Long currentDepartmentId,
            @RequestParam(required = false) Long requestedDepartmentId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return helpService.filterHelp(requestType, status, priority,
                employeeId, assignedTo, currentDepartmentId, requestedDepartmentId,
                search, sortBy, sortDirection, page, size);
    }

}
