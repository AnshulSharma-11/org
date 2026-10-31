package com.orgpluse.attendance;

import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Employee self-service attendance actions.
 * Route prefix: /api/v1/employee/{employeeId}/attendance   (ROLE_EMPLOYEE only, see SecurityConfig)
 *
 * Every call verifies that {employeeId} belongs to the logged-in employee.
 */
@RestController
@RequestMapping("/api/v1/employee/{employeeId}/attendance")
public class EmployeeAttendanceController {

    @Autowired private AttendanceService attendanceService;
    @Autowired private SelfAccessGuard   guard;
    @Autowired private UniversalResponse response;

    /** GET …/attendance/today — current state + which buttons are allowed. */
    @GetMapping("/today")
    public ResponseEntity<ResponseWrapper> today(@PathVariable Long employeeId, Authentication auth) {
        guard.assertSelf(employeeId, auth);
        return response.send("Today's attendance fetched", attendanceService.today(employeeId), HttpStatus.OK);
    }

    @PostMapping("/check-in")
    public ResponseEntity<ResponseWrapper> checkIn(@PathVariable Long employeeId, Authentication auth) {
        guard.assertSelf(employeeId, auth);
        return response.send("Checked in successfully", attendanceService.checkIn(employeeId), HttpStatus.OK);
    }

    @PostMapping("/start-break")
    public ResponseEntity<ResponseWrapper> startBreak(@PathVariable Long employeeId, Authentication auth) {
        guard.assertSelf(employeeId, auth);
        return response.send("Break started", attendanceService.startBreak(employeeId), HttpStatus.OK);
    }

    @PostMapping("/resume-work")
    public ResponseEntity<ResponseWrapper> resumeWork(@PathVariable Long employeeId, Authentication auth) {
        guard.assertSelf(employeeId, auth);
        return response.send("Back to work", attendanceService.resumeWork(employeeId), HttpStatus.OK);
    }

    @PostMapping("/check-out")
    public ResponseEntity<ResponseWrapper> checkOut(@PathVariable Long employeeId, Authentication auth) {
        guard.assertSelf(employeeId, auth);
        return response.send("Checked out successfully", attendanceService.checkOut(employeeId), HttpStatus.OK);
    }
}
