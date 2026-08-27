package com.orgpluse.controllers;

import com.orgpluse.entities.Leave;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.LeaveService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class LeaveController {

    @Autowired private LeaveService leaveService;

    @PostMapping("/leaves")
    public ResponseEntity<ResponseWrapper> addLeave(@RequestBody Leave leave) {
        return leaveService.addLeave(leave);
    }

    @PutMapping("/leaves/{id}")
    public ResponseEntity<ResponseWrapper> updateLeave(@PathVariable Long id,
                                                        @RequestBody Leave leave) {
        return leaveService.updateLeave(id, leave);
    }

    @DeleteMapping("/leaves/{id}")
    public ResponseEntity<ResponseWrapper> deleteLeave(@PathVariable Long id) {
        return leaveService.deleteLeave(id);
    }

    @GetMapping("/leaves/{id}")
    public ResponseEntity<ResponseWrapper> getLeaveById(@PathVariable Long id) {
        return leaveService.getLeaveById(id);
    }

    // GET /api/v1/admin/leaves?sortBy=&sortDirection=&page=0&size=20
    @GetMapping("/leaves")
    public ResponseEntity<ResponseWrapper> getAllLeaves(
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return leaveService.getAllLeaves(sortBy, sortDirection, page, size);
    }

    // GET /api/v1/admin/leaves/filter?employeeId=&status=&leaveType=&...&page=0&size=20
    @GetMapping("/leaves/filter")
    public ResponseEntity<ResponseWrapper> filterLeaves(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String leaveType,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long approvedBy,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return leaveService.filterLeaves(employeeId, status, leaveType,
                startDate, endDate, approvedBy, sortBy, sortDirection, page, size);
    }

}
