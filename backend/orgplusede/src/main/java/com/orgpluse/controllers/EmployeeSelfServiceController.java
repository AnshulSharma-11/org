package com.orgpluse.controllers;

import com.orgpluse.entities.Help;
import com.orgpluse.entities.Leave;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.HelpService;
import com.orgpluse.services.LeaveService;
import com.orgpluse.services.PayrollRunService;
import com.orgpluse.services.TimeRecordService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Employee self-service endpoints — read + limited write for the logged-in employee.
 * Route prefix: /api/v1/employee/{employeeId}
 * Secured by SecurityConfig → ROLE_EMPLOYEE only.
 *
 * No new service logic — every method delegates to the existing admin services
 * using the {employeeId} path variable as the filter key.
 */
@RestController
@RequestMapping("/api/v1/employee/{employeeId}")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployeeSelfServiceController {

    @Autowired private LeaveService      leaveService;
    @Autowired private PayrollRunService payrollRunService;
    @Autowired private TimeRecordService timeRecordService;
    @Autowired private HelpService       helpService;

    // ─────────────────────────────────────────────────────────────────────────
    //  LEAVES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/employee/{employeeId}/leaves
     * Returns a PageResponse of all leave records for this employee.
     * Supports optional filters: status, leaveType, startDate, endDate, sortBy, sortDirection.
     */
    @GetMapping("/leaves")
    public ResponseEntity<ResponseWrapper> getMyLeaves(
            @PathVariable Long employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String leaveType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        return leaveService.filterLeaves(
                employeeId, status, leaveType, startDate, endDate,
                null, sortBy, sortDirection, page, size);
    }

    /**
     * POST /api/v1/employee/{employeeId}/leaves
     * Submits a new leave application. Employee is forced from the path variable —
     * the request body employee field is ignored for security.
     * Status is always set to PENDING by LeaveService.addLeave.
     */
    @PostMapping("/leaves")
    public ResponseEntity<ResponseWrapper> applyLeave(
            @PathVariable Long employeeId,
            @RequestBody Leave leave) {

        // Force the employee from the authenticated path — ignore any body value
        com.orgpluse.entities.Employee emp = new com.orgpluse.entities.Employee();
        emp.setId(employeeId);
        leave.setEmployee(emp);

        return leaveService.addLeave(leave);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PAYROLL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/employee/{employeeId}/payroll
     * Returns all payroll records for this employee as a plain list.
     * Supports optional filters: month, year, status, sortBy, sortDirection.
     */
    @GetMapping("/payroll")
    public ResponseEntity<ResponseWrapper> getMyPayroll(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection) {

        return payrollRunService.filterPayrollRuns(
                employeeId, month, year, status, null, sortBy, sortDirection);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  ATTENDANCE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/employee/{employeeId}/attendance
     * Returns a PageResponse of time records for this employee.
     * Supports optional filters: status, dateFrom, dateTo, sortBy, sortDirection.
     */
    @GetMapping("/attendance")
    public ResponseEntity<ResponseWrapper> getMyAttendance(
            @PathVariable Long employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        return timeRecordService.filterTimeRecords(
                employeeId, status, dateFrom, dateTo, sortBy, sortDirection, page, size);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  HELP TICKETS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/employee/{employeeId}/help
     * Returns a PageResponse of help tickets raised by this employee.
     * Supports optional filters: status, requestType, priority, sortBy, sortDirection.
     */
    @GetMapping("/help")
    public ResponseEntity<ResponseWrapper> getMyHelp(
            @PathVariable Long employeeId,
            @RequestParam(required = false) String requestType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        return helpService.filterHelp(
                requestType, status, priority,
                employeeId, null, null, null,
                null, sortBy, sortDirection, page, size);
    }

    /**
     * POST /api/v1/employee/{employeeId}/help
     * Raises a new help ticket. Employee is forced from the path variable —
     * the request body employee field is ignored for security.
     * Status is always set to OPEN by HelpService.addHelp.
     */
    @PostMapping("/help")
    public ResponseEntity<ResponseWrapper> raiseHelp(
            @PathVariable Long employeeId,
            @RequestBody Help help) {

        // Force the employee from the authenticated path — ignore any body value
        com.orgpluse.entities.Employee helpEmp = new com.orgpluse.entities.Employee();
        helpEmp.setId(employeeId);
        help.setEmployee(helpEmp);

        return helpService.addHelp(help);
    }
}
