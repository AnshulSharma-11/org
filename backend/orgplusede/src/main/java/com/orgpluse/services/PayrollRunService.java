package com.orgpluse.services;

import com.orgpluse.entities.Employee;
import com.orgpluse.entities.PayrollRun;
import com.orgpluse.repositories.EmployeeRepository;
import com.orgpluse.repositories.PayrollRunRepository;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import com.orgpluse.specifications.PayrollRunSpecification;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PayrollRunService {

    @Autowired
    private PayrollRunRepository payrollRunRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UniversalResponse response;
    
    @Autowired
    private RazorpayClient razorpayClient;

    // ── CREATE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> addPayrollRun(PayrollRun payrollRun) {
        // Validate employee (required — every payslip belongs to an employee)
        if (payrollRun.getEmployee() == null || payrollRun.getEmployee().getId() == null) {
            return response.send("Employee is required for a payroll record", null, HttpStatus.BAD_REQUEST);
        }
        Optional<Employee> employee = employeeRepository.findById(payrollRun.getEmployee().getId());
        if (employee.isEmpty()) {
            return response.send("Employee not found with id: "
                    + payrollRun.getEmployee().getId(), null, HttpStatus.NOT_FOUND);
        }
        payrollRun.setEmployee(employee.get());

        // Validate processedBy employee (optional — payroll may be system-generated)
        if (payrollRun.getProcessedBy() != null
                && payrollRun.getProcessedBy().getId() != null) {
            Optional<Employee> processor = employeeRepository.findById(
                    payrollRun.getProcessedBy().getId());
            if (processor.isEmpty()) {
                return response.send("Processor (Employee) not found with id: "
                        + payrollRun.getProcessedBy().getId(), null, HttpStatus.NOT_FOUND);
            }
            payrollRun.setProcessedBy(processor.get());
        } else {
            payrollRun.setProcessedBy(null);
        }

        // Default status to DRAFT if not provided
        if (payrollRun.getStatus() == null || payrollRun.getStatus().isBlank()) {
            payrollRun.setStatus("DRAFT");
        }

        PayrollRun saved = payrollRunRepository.save(payrollRun);
        return response.send("Payroll run created successfully", saved, HttpStatus.CREATED);
    }

    // ── BULK CREATE — one payslip per active employee ─────────────────────────

    /**
     * Called by admin "Run Payroll" form.
     * Accepts: month, year, runDate, processedById (optional), defaultPayslipData (optional JSON).
     * Creates one PayrollRun row per ACTIVE employee.
     * Skips employees who already have a record for the same month+year to prevent duplicates.
     */
    public ResponseEntity<ResponseWrapper> bulkCreatePayrollRun(Map<String, Object> request) {
        // Parse inputs
        Integer month;
        Integer year;
        LocalDate runDate;
        try {
            month   = Integer.valueOf(request.get("month").toString());
            year    = Integer.valueOf(request.get("year").toString());
            runDate = LocalDate.parse(request.get("runDate").toString());
        } catch (Exception e) {
            return response.send("month, year, and runDate are required", null, HttpStatus.BAD_REQUEST);
        }
        if (month < 1 || month > 12) {
            return response.send("month must be between 1 and 12", null, HttpStatus.BAD_REQUEST);
        }

        // Optional processedBy
        Employee processor = null;
        Object processedByIdObj = request.get("processedById");
        if (processedByIdObj != null && !processedByIdObj.toString().isBlank()) {
            Long processedById = Long.valueOf(processedByIdObj.toString());
            Optional<Employee> p = employeeRepository.findById(processedById);
            if (p.isEmpty()) {
                return response.send("Processor not found with id: " + processedById,
                        null, HttpStatus.NOT_FOUND);
            }
            processor = p.get();
        }

        // Optional default payslip JSON (same template applied to all employees this run)
        String defaultPayslipData = request.containsKey("payslipData")
                ? (String) request.get("payslipData") : null;

        // DB-level filter — replaces findAll().stream().filter(...)
        List<Employee> activeEmployees = employeeRepository.findByStatusIgnoreCase("ACTIVE");

        if (activeEmployees.isEmpty()) {
            return response.send("No active employees found", null, HttpStatus.BAD_REQUEST);
        }

        // Load existing payroll records for this month+year once — avoids O(n²) per-employee query
        Specification<PayrollRun> existingSpec = Specification
                .where(PayrollRunSpecification.hasMonth(month))
                .and(PayrollRunSpecification.hasYear(year));
        List<PayrollRun> existingRuns = payrollRunRepository.findAll(existingSpec);
        Set<Long> alreadyProcessed = existingRuns.stream()
                .filter(r -> r.getEmployee() != null)
                .map(r -> r.getEmployee().getId())
                .collect(Collectors.toSet());

        List<PayrollRun> created = new ArrayList<>();
        List<String> skipped    = new ArrayList<>();

        for (Employee emp : activeEmployees) {
            if (alreadyProcessed.contains(emp.getId())) {
                skipped.add(emp.getFirstName() + " " + emp.getLastName());
                continue;
            }

            PayrollRun run = new PayrollRun();
            run.setEmployee(emp);
            run.setMonth(month);
            run.setYear(year);
            run.setRunDate(runDate);
            run.setStatus("PROCESSED");
            run.setProcessedBy(processor);
            run.setPayslipData(defaultPayslipData);
            created.add(payrollRunRepository.save(run));
        }

        String msg = created.size() + " payslip(s) created";
        if (!skipped.isEmpty()) msg += "; skipped (already exists): " + String.join(", ", skipped);
        return response.send(msg, created, HttpStatus.CREATED);
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> getPayrollRunById(Long id) {
        Optional<PayrollRun> payrollRun = payrollRunRepository.findById(id);
        if (payrollRun.isEmpty()) {
            return response.send("Payroll run not found with id: " + id,
                    null, HttpStatus.NOT_FOUND);
        }
        return response.send("Payroll run fetched successfully", payrollRun.get(), HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> getAllPayrollRuns(String sortBy,
                                                              String sortDirection) {
        Specification<PayrollRun> spec = Specification
                .where(PayrollRunSpecification.sortByField(sortBy, sortDirection));

        List<PayrollRun> runs = payrollRunRepository.findAll(spec);
        return response.send("Payroll runs fetched successfully", runs, HttpStatus.OK);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> updatePayrollRun(Long id,
                                                             PayrollRun updatedRun) {
        Optional<PayrollRun> existing = payrollRunRepository.findById(id);
        if (existing.isEmpty()) {
            return response.send("Payroll run not found with id: " + id,
                    null, HttpStatus.NOT_FOUND);
        }

        PayrollRun run = existing.get();
        run.setMonth(updatedRun.getMonth());
        run.setYear(updatedRun.getYear());
        run.setRunDate(updatedRun.getRunDate());
        run.setStatus(updatedRun.getStatus());
        run.setPayslipData(updatedRun.getPayslipData());

        // Update employee (required)
        if (updatedRun.getEmployee() != null && updatedRun.getEmployee().getId() != null) {
            Optional<Employee> emp = employeeRepository.findById(updatedRun.getEmployee().getId());
            if (emp.isEmpty()) {
                return response.send("Employee not found with id: "
                        + updatedRun.getEmployee().getId(), null, HttpStatus.NOT_FOUND);
            }
            run.setEmployee(emp.get());
        }

        if (updatedRun.getProcessedBy() != null
                && updatedRun.getProcessedBy().getId() != null) {
            Optional<Employee> processor = employeeRepository.findById(
                    updatedRun.getProcessedBy().getId());
            if (processor.isEmpty()) {
                return response.send("Processor (Employee) not found with id: "
                        + updatedRun.getProcessedBy().getId(), null, HttpStatus.NOT_FOUND);
            }
            run.setProcessedBy(processor.get());
        } else {
            run.setProcessedBy(null);
        }

        PayrollRun saved = payrollRunRepository.save(run);
        return response.send("Payroll run updated successfully", saved, HttpStatus.OK);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> deletePayrollRun(Long id) {
        Optional<PayrollRun> run = payrollRunRepository.findById(id);
        if (run.isEmpty()) {
            return response.send("Payroll run not found with id: " + id,
                    null, HttpStatus.NOT_FOUND);
        }
        payrollRunRepository.deleteById(id);
        return response.send("Payroll run deleted successfully", null, HttpStatus.OK);
    }

    // ── FILTER ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> filterPayrollRuns(Long employeeId,
                                                              Integer month,
                                                              Integer year,
                                                              String status,
                                                              Long processedById,
                                                              String sortBy,
                                                              String sortDirection) {
        // Use compound year+month sort when no specific field is given
        Specification<PayrollRun> sortSpec = (sortBy != null && !sortBy.isBlank())
                ? PayrollRunSpecification.sortByField(sortBy, sortDirection)
                : PayrollRunSpecification.sortByYearMonth(sortDirection);

        Specification<PayrollRun> spec = Specification
                .where(PayrollRunSpecification.hasEmployee(employeeId))
                .and(PayrollRunSpecification.hasMonth(month))
                .and(PayrollRunSpecification.hasYear(year))
                .and(PayrollRunSpecification.hasStatus(status))
                .and(PayrollRunSpecification.hasProcessedBy(processedById))
                .and(sortSpec);

        List<PayrollRun> runs = payrollRunRepository.findAll(spec);
        return response.send("Payroll runs filtered successfully", runs, HttpStatus.OK);
    }
    // payroll---------------------------------------------------------------------------------------------
    public ResponseEntity<?> createOrder(
            Long payrollId)
            throws Exception {

        PayrollRun payroll =
                payrollRunRepository
                        .findById(payrollId)
                        .orElseThrow();

        JSONObject options =
                new JSONObject();

        options.put(
                "amount",
                50000 * 100
        );

        options.put(
                "currency",
                "INR"
        );

        Order order =
                razorpayClient.orders
                        .create(options);

        payroll.setRazorpayOrderId(
                order.get("id")
        );

        payrollRunRepository.save(
                payroll
        );

        return ResponseEntity.ok(order);
    }
    
    //payroll verification
    
    public ResponseEntity<?> verifyPayment(
            Map<String,Object> request) {

        Long payrollId =
                Long.valueOf(
                        request.get(
                                "payrollId"
                        ).toString()
                );

        PayrollRun payroll =
                payrollRunRepository
                        .findById(payrollId)
                        .orElseThrow();

        payroll.setStatus("PAID");

        payroll.setRazorpayPaymentId(
                request.get(
                        "paymentId"
                ).toString()
        );

        payroll.setTransactionId(
                request.get(
                        "paymentId"
                ).toString()
        );

        payrollRunRepository.save(
                payroll
        );

        return response.send(
                "Payment Success",
                payroll,
                HttpStatus.OK
        );
    }
}
