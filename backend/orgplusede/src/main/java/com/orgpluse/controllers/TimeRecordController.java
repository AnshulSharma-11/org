package com.orgpluse.controllers;

import com.orgpluse.dto.TimeRecordDTO;
import com.orgpluse.entities.TimeRecord;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.TimeRecordService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class TimeRecordController {

    @Autowired private TimeRecordService timeRecordService;

    // POST /api/v1/admin/time-records — upsert (mark or update attendance)
    @PostMapping("/time-records")
    public ResponseEntity<ResponseWrapper> markAttendance(@RequestBody TimeRecordDTO dto) {
        return timeRecordService.markAttendance(dto);
    }

    @PutMapping("/time-records/{id}")
    public ResponseEntity<ResponseWrapper> updateTimeRecord(@PathVariable Long id,
                                                             @RequestBody TimeRecord timeRecord) {
        return timeRecordService.updateTimeRecord(id, timeRecord);
    }

    @DeleteMapping("/time-records/{id}")
    public ResponseEntity<ResponseWrapper> deleteTimeRecord(@PathVariable Long id) {
        return timeRecordService.deleteTimeRecord(id);
    }

    @GetMapping("/time-records/{id}")
    public ResponseEntity<ResponseWrapper> getTimeRecordById(@PathVariable Long id) {
        return timeRecordService.getTimeRecordById(id);
    }

    // GET /api/v1/admin/time-records?sortBy=&sortDirection=&page=0&size=20
    @GetMapping("/time-records")
    public ResponseEntity<ResponseWrapper> getAllTimeRecords(
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return timeRecordService.getAllTimeRecords(sortBy, sortDirection, page, size);
    }

    // GET /api/v1/admin/time-records/filter?employeeId=&status=&dateFrom=&dateTo=&...&page=0&size=20
    @GetMapping("/time-records/filter")
    public ResponseEntity<ResponseWrapper> filterTimeRecords(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return timeRecordService.filterTimeRecords(employeeId, status,
                dateFrom, dateTo, sortBy, sortDirection, page, size);
    }

}
