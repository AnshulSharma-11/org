package com.orgpluse.controllers;

import com.orgpluse.entities.PayrollRun;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.PayrollRunService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class PayrollRunController {

    @Autowired
    private PayrollRunService payrollRunService;

    // POST /api/v1/admin/payroll
    @PostMapping("/payroll")
    public ResponseEntity<ResponseWrapper> addPayrollRun(@RequestBody PayrollRun payrollRun) {
        return payrollRunService.addPayrollRun(payrollRun);
    }

    // POST /api/v1/admin/payroll/bulk
    // Body: { month, year, runDate, processedById?, payslipData? }
    // Creates one payslip record per active employee for the given month+year.
    @PostMapping("/payroll/bulk")
    public ResponseEntity<ResponseWrapper> bulkCreatePayrollRun(
            @RequestBody Map<String, Object> request) {
        return payrollRunService.bulkCreatePayrollRun(request);
    }

    // PUT /api/v1/admin/payroll/{id}
    @PutMapping("/payroll/{id}")
    public ResponseEntity<ResponseWrapper> updatePayrollRun(@PathVariable Long id,
                                                             @RequestBody PayrollRun payrollRun) {
        return payrollRunService.updatePayrollRun(id, payrollRun);
    }

    // DELETE /api/v1/admin/payroll/{id}
    @DeleteMapping("/payroll/{id}")
    public ResponseEntity<ResponseWrapper> deletePayrollRun(@PathVariable Long id) {
        return payrollRunService.deletePayrollRun(id);
    }

    // GET /api/v1/admin/payroll/{id}
    @GetMapping("/payroll/{id}")
    public ResponseEntity<ResponseWrapper> getPayrollRunById(@PathVariable Long id) {
        return payrollRunService.getPayrollRunById(id);
    }

    // GET /api/v1/admin/payroll?sortBy=&sortDirection=
    @GetMapping("/payroll")
    public ResponseEntity<ResponseWrapper> getAllPayrollRuns(
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection) {
        return payrollRunService.getAllPayrollRuns(sortBy, sortDirection);
    }

    // GET /api/v1/admin/payroll/filter?employeeId=&month=&year=&status=&processedBy=&sortBy=&sortDirection=
    @GetMapping("/payroll/filter")
    public ResponseEntity<ResponseWrapper> filterPayrollRuns(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long processedBy,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection) {
        return payrollRunService.filterPayrollRuns(employeeId, month, year, status,
                processedBy, sortBy, sortDirection);
    }
    
    @PostMapping("/payroll/create-order")
    public ResponseEntity<?> createOrder(
            @RequestParam Long payrollId)
            throws Exception {

        return payrollRunService
                .createOrder(payrollId);
    }
    
    @PostMapping("/payroll/verify")
    public ResponseEntity<?> verifyPayment(
            @RequestBody Map<String,Object>
                    request) {

        return payrollRunService
                .verifyPayment(request);
    }

}
