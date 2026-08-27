package com.orgpluse.controllers;

import com.orgpluse.entities.PerformanceReview;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.PerformanceReviewService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class PerformanceReviewController {

    @Autowired private PerformanceReviewService reviewService;

    @PostMapping("/performance")
    public ResponseEntity<ResponseWrapper> addReview(@RequestBody PerformanceReview review) {
        return reviewService.addReview(review);
    }

    @PutMapping("/performance/{id}")
    public ResponseEntity<ResponseWrapper> updateReview(@PathVariable Long id,
                                                         @RequestBody PerformanceReview review) {
        return reviewService.updateReview(id, review);
    }

    @DeleteMapping("/performance/{id}")
    public ResponseEntity<ResponseWrapper> deleteReview(@PathVariable Long id) {
        return reviewService.deleteReview(id);
    }

    @GetMapping("/performance/{id}")
    public ResponseEntity<ResponseWrapper> getReviewById(@PathVariable Long id) {
        return reviewService.getReviewById(id);
    }

    // GET /api/v1/admin/performance?sortBy=&sortDirection=&page=0&size=20
    @GetMapping("/performance")
    public ResponseEntity<ResponseWrapper> getAllReviews(
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return reviewService.getAllReviews(sortBy, sortDirection, page, size);
    }

    // GET /api/v1/admin/performance/filter?employeeId=&...&page=0&size=20
    @GetMapping("/performance/filter")
    public ResponseEntity<ResponseWrapper> filterReviews(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long reviewerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String cycleName,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return reviewService.filterReviews(employeeId, reviewerId, status,
                cycleName, startDate, endDate, sortBy, sortDirection, page, size);
    }

}
