package com.orgpluse.services;

import com.orgpluse.common.PageResponse;
import com.orgpluse.common.PageableUtils;
import com.orgpluse.entities.Designation;
import com.orgpluse.exception.ResourceNotFoundException;
import com.orgpluse.repositories.DesignationRepository;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import com.orgpluse.specifications.DesignationSpecification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class DesignationService {

    private static final Set<String> ALLOWED_SORTS = Set.of("id", "title", "level", "createdAt");

    @Autowired private DesignationRepository designationRepository;
    @Autowired private UniversalResponse response;

    public ResponseEntity<ResponseWrapper> addDesignation(Designation designation) {
        return response.send("Designation created successfully",
                designationRepository.save(designation), HttpStatus.CREATED);
    }

    public ResponseEntity<ResponseWrapper> getDesignationById(Long id) {
        Designation designation = designationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Designation", id));
        return response.send("Designation fetched successfully", designation, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> getAllDesignations(String search, String sortBy,
                                                               String sortDirection,
                                                               Integer page, Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        return response.send("Designations fetched successfully",
                new PageResponse<>(designationRepository.findAll(
                        DesignationSpecification.searchByTitle(search), pageable)),
                HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> updateDesignation(Long id, Designation updated) {
        Designation designation = designationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Designation", id));
        designation.setTitle(updated.getTitle());
        designation.setLevel(updated.getLevel());
        return response.send("Designation updated successfully",
                designationRepository.save(designation), HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> deleteDesignation(Long id) {
        if (!designationRepository.existsById(id))
            throw new ResourceNotFoundException("Designation", id);
        designationRepository.deleteById(id);
        return response.send("Designation deleted successfully", null, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> filterDesignations(Integer level, String sortBy,
                                                               String sortDirection,
                                                               Integer page, Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        return response.send("Designations filtered successfully",
                new PageResponse<>(designationRepository.findAll(
                        DesignationSpecification.hasLevel(level), pageable)),
                HttpStatus.OK);
    }

}
