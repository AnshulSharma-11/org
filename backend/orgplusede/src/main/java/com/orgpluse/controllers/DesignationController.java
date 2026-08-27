package com.orgpluse.controllers;

import com.orgpluse.entities.Designation;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.DesignationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class DesignationController {

    @Autowired private DesignationService designationService;

    @PostMapping("/designations")
    public ResponseEntity<ResponseWrapper> addDesignation(@RequestBody Designation designation) {
        return designationService.addDesignation(designation);
    }

    @PutMapping("/designations/{id}")
    public ResponseEntity<ResponseWrapper> updateDesignation(@PathVariable Long id,
                                                              @RequestBody Designation designation) {
        return designationService.updateDesignation(id, designation);
    }

    @DeleteMapping("/designations/{id}")
    public ResponseEntity<ResponseWrapper> deleteDesignation(@PathVariable Long id) {
        return designationService.deleteDesignation(id);
    }

    @GetMapping("/designations/{id}")
    public ResponseEntity<ResponseWrapper> getDesignationById(@PathVariable Long id) {
        return designationService.getDesignationById(id);
    }

    // GET /api/v1/admin/designations?search=&sortBy=&sortDirection=&page=0&size=20
    @GetMapping("/designations")
    public ResponseEntity<ResponseWrapper> getAllDesignations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return designationService.getAllDesignations(search, sortBy, sortDirection, page, size);
    }

    // GET /api/v1/admin/designations/filter?level=&sortBy=&sortDirection=&page=0&size=20
    @GetMapping("/designations/filter")
    public ResponseEntity<ResponseWrapper> filterDesignations(
            @RequestParam(required = false) Integer level,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return designationService.filterDesignations(level, sortBy, sortDirection, page, size);
    }

}
