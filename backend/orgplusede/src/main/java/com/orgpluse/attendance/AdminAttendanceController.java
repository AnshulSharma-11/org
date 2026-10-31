package com.orgpluse.attendance;

import com.orgpluse.attendance.AttendanceDtos.CsvExport;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

/**
 * HR attendance dashboard endpoints.
 * Route prefix: /api/v1/admin/attendance   (ROLE_ADMIN only, see SecurityConfig)
 */
@RestController
@RequestMapping("/api/v1/admin/attendance")
public class AdminAttendanceController {

    @Autowired private AttendanceInsightsService insights;
    @Autowired private UniversalResponse response;

    /** GET …/stats?date=&departmentId= — cards: expected, present, late, working, on break, on leave, absent. */
    @GetMapping("/stats")
    public ResponseEntity<ResponseWrapper> stats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long departmentId) {
        return response.send("Attendance stats fetched", insights.stats(date, departmentId), HttpStatus.OK);
    }

    /** GET …/live?date=&departmentId= — employees currently clocked in (working / on break). */
    @GetMapping("/live")
    public ResponseEntity<ResponseWrapper> live(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long departmentId) {
        return response.send("Live attendance fetched", insights.live(date, departmentId), HttpStatus.OK);
    }

    /** GET …/trends?range=7d|30d|12m&departmentId= */
    @GetMapping("/trends")
    public ResponseEntity<ResponseWrapper> trends(
            @RequestParam(required = false, defaultValue = "7d") String range,
            @RequestParam(required = false) Long departmentId) {
        return response.send("Attendance trends fetched", insights.trends(range, departmentId), HttpStatus.OK);
    }

    /** GET …/export?dateFrom=&dateTo=&status=&departmentId=&employeeId= — CSV download. */
    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long employeeId) {
        CsvExport csv = insights.exportCsv(dateFrom, dateTo, status, departmentId, employeeId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + csv.filename() + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.bytes());
    }
}
