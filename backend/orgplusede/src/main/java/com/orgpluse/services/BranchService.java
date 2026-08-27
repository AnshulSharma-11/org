package com.orgpluse.services;

import com.orgpluse.common.PageResponse;
import com.orgpluse.common.PageableUtils;
import com.orgpluse.entities.Branch;
import com.orgpluse.exception.ResourceNotFoundException;
import com.orgpluse.repositories.BranchRepository;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import com.orgpluse.specifications.BranchSpecification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class BranchService {

    private static final Set<String> ALLOWED_SORTS =
            Set.of("id", "name", "city", "country");

    @Autowired private BranchRepository branchRepository;
    @Autowired private UniversalResponse response;

    public ResponseEntity<ResponseWrapper> addBranch(Branch branch) {
        Branch saved = branchRepository.save(branch);
        return response.send("Branch created successfully", saved, HttpStatus.CREATED);
    }

    public ResponseEntity<ResponseWrapper> getBranchById(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", id));
        return response.send("Branch fetched successfully", branch, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> getAllBranches(String search,
                                                          String sortBy,
                                                          String sortDirection,
                                                          Integer page,
                                                          Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Page<Branch> result = branchRepository.findAll(
                BranchSpecification.searchByName(search), pageable);
        return response.send("Branches fetched successfully",
                new PageResponse<>(result), HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> updateBranch(Long id, Branch updatedBranch) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", id));
        branch.setName(updatedBranch.getName());
        branch.setCity(updatedBranch.getCity());
        branch.setCountry(updatedBranch.getCountry());
        return response.send("Branch updated successfully",
                branchRepository.save(branch), HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> deleteBranch(Long id) {
        if (!branchRepository.existsById(id))
            throw new ResourceNotFoundException("Branch", id);
        branchRepository.deleteById(id);
        return response.send("Branch deleted successfully", null, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> filterBranches(String search,
                                                           String city,
                                                           String country,
                                                           String sortBy,
                                                           String sortDirection,
                                                           Integer page,
                                                           Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Specification<Branch> spec = Specification
                .where(BranchSpecification.searchByName(search))
                .and(BranchSpecification.hasCity(city))
                .and(BranchSpecification.hasCountry(country));
        return response.send("Branches filtered successfully",
                new PageResponse<>(branchRepository.findAll(spec, pageable)), HttpStatus.OK);
    }

}
