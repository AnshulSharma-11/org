package com.orgpluse.services;

import com.orgpluse.common.PageResponse;
import com.orgpluse.common.PageableUtils;
import com.orgpluse.entities.Employee;
import com.orgpluse.entities.PerformanceReview;
import com.orgpluse.repositories.EmployeeRepository;
import com.orgpluse.exception.BadRequestException;
import com.orgpluse.exception.ResourceNotFoundException;
import com.orgpluse.repositories.PerformanceReviewRepository;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import com.orgpluse.specifications.PerformanceReviewSpecification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;

@Service
public class PerformanceReviewService {

    private static final Set<String> ALLOWED_SORTS =
            Set.of("id", "cycleName", "startDate", "endDate",
                   "overallRating", "status", "submittedAt", "createdAt");

    @Autowired private PerformanceReviewRepository reviewRepository;
    @Autowired private EmployeeRepository           employeeRepository;
    @Autowired private UniversalResponse            response;

    private void resolveFKs(PerformanceReview review) {
        if (review.getEmployee() == null || review.getEmployee().getId() == null)
            throw new BadRequestException("Employee (reviewee) is required");

        Employee employee = employeeRepository.findById(review.getEmployee().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee",
                        review.getEmployee().getId()));
        review.setEmployee(employee);

        if (review.getReviewer() != null && review.getReviewer().getId() != null) {
            if (review.getReviewer().getId().equals(review.getEmployee().getId()))
                throw new BadRequestException("An employee cannot review themselves");
            Employee reviewer = employeeRepository.findById(review.getReviewer().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reviewer",
                            review.getReviewer().getId()));
            review.setReviewer(reviewer);
        } else { review.setReviewer(null); }
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> addReview(PerformanceReview review) {
        resolveFKs(review);
        if (review.getStatus() == null || review.getStatus().isBlank()) review.setStatus("PENDING");
        PerformanceReview saved = reviewRepository.save(review);
        return response.send("Performance review created successfully", saved, HttpStatus.CREATED);
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> getReviewById(Long id) {
        PerformanceReview review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Performance review", id));
        return response.send("Performance review fetched successfully", review, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> getAllReviews(String sortBy,
                                                          String sortDirection,
                                                          Integer page,
                                                          Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Page<PerformanceReview> result = reviewRepository.findAll(pageable);
        return response.send("Performance reviews fetched successfully",
                new PageResponse<>(result), HttpStatus.OK);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> updateReview(Long id, PerformanceReview updatedReview) {
        PerformanceReview review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Performance review", id));
        review.setCycleName(updatedReview.getCycleName());
        review.setStartDate(updatedReview.getStartDate());
        review.setEndDate(updatedReview.getEndDate());
        review.setCriteriaRatings(updatedReview.getCriteriaRatings());
        review.setOverallRating(updatedReview.getOverallRating());
        review.setStatus(updatedReview.getStatus());
        review.setSubmittedAt(updatedReview.getSubmittedAt());

        resolveFKs(updatedReview);
        review.setEmployee(updatedReview.getEmployee());
        review.setReviewer(updatedReview.getReviewer());

        PerformanceReview saved = reviewRepository.save(review);
        return response.send("Performance review updated successfully", saved, HttpStatus.OK);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> deleteReview(Long id) {
        if (!reviewRepository.existsById(id))
            throw new ResourceNotFoundException("Performance review", id);
        reviewRepository.deleteById(id);
        return response.send("Performance review deleted successfully", null, HttpStatus.OK);
    }

    // ── FILTER ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> filterReviews(Long employeeId,
                                                          Long reviewerId,
                                                          String status,
                                                          String cycleName,
                                                          LocalDate startDate,
                                                          LocalDate endDate,
                                                          String sortBy,
                                                          String sortDirection,
                                                          Integer page,
                                                          Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Specification<PerformanceReview> spec = Specification
                .where(PerformanceReviewSpecification.hasEmployee(employeeId))
                .and(PerformanceReviewSpecification.hasReviewer(reviewerId))
                .and(PerformanceReviewSpecification.hasStatus(status))
                .and(PerformanceReviewSpecification.hasCycleName(cycleName))
                .and(PerformanceReviewSpecification.startDateFrom(startDate))
                .and(PerformanceReviewSpecification.endDateTo(endDate));
        Page<PerformanceReview> result = reviewRepository.findAll(spec, pageable);
        return response.send("Performance reviews filtered successfully",
                new PageResponse<>(result), HttpStatus.OK);
    }

}
