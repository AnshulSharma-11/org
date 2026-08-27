package com.orgpluse.controllers;

import com.orgpluse.entities.Branch;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.BranchService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class BranchController {

    @Autowired private BranchService branchService;

    @PostMapping("/branches")
    public ResponseEntity<ResponseWrapper> addBranch(@RequestBody Branch branch) {
        return branchService.addBranch(branch);
    }

    @PutMapping("/branches/{id}")
    public ResponseEntity<ResponseWrapper> updateBranch(@PathVariable Long id,
                                                         @RequestBody Branch branch) {
        return branchService.updateBranch(id, branch);
    }

    @DeleteMapping("/branches/{id}")
    public ResponseEntity<ResponseWrapper> deleteBranch(@PathVariable Long id) {
        return branchService.deleteBranch(id);
    }

    @GetMapping("/branches/{id}")
    public ResponseEntity<ResponseWrapper> getBranchById(@PathVariable Long id) {
        return branchService.getBranchById(id);
    }

    @GetMapping("/branches")
    public ResponseEntity<ResponseWrapper> getAllBranches(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return branchService.getAllBranches(search, sortBy, sortDirection, page, size);
    }

    @GetMapping("/branches/filter")
    public ResponseEntity<ResponseWrapper> filterBranches(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return branchService.filterBranches(search, city, country, sortBy, sortDirection, page, size);
    }

}
