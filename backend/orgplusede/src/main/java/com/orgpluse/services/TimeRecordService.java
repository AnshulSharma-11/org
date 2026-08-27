package com.orgpluse.services;

import com.orgpluse.common.PageResponse;
import com.orgpluse.common.PageableUtils;
import com.orgpluse.entities.Employee;
import com.orgpluse.entities.TimeRecord;
import com.orgpluse.repositories.EmployeeRepository;
import com.orgpluse.exception.BadRequestException;
import com.orgpluse.exception.ResourceNotFoundException;
import com.orgpluse.repositories.TimeRecordRepository;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;
import com.orgpluse.specifications.TimeRecordSpecification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.orgpluse.dto.TimeRecordDTO;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import java.util.Set;

@Service
public class TimeRecordService {

    private static final Set<String> ALLOWED_SORTS =
            Set.of("id", "date", "status", "hoursWorked", "checkIn", "checkOut", "createdAt");

    @Autowired private TimeRecordRepository timeRecordRepository;
    @Autowired private EmployeeRepository   employeeRepository;
    @Autowired private UniversalResponse    response;

    // ── CREATE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> addTimeRecord(TimeRecord timeRecord) {
        if (timeRecord.getEmployee() == null || timeRecord.getEmployee().getId() == null)
            throw new BadRequestException("Employee is required");

        Employee employee = employeeRepository.findById(timeRecord.getEmployee().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee",
                        timeRecord.getEmployee().getId()));
        timeRecord.setEmployee(employee);

        TimeRecord saved = timeRecordRepository.save(timeRecord);
        return response.send("Time record created successfully", saved, HttpStatus.CREATED);
    }

    // ── MARK ATTENDANCE (upsert) ──────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> markAttendance(TimeRecordDTO dto) {
        if (dto.getEmployee() == null || dto.getEmployee().getId() == null)
            throw new BadRequestException("Employee is required");
        if (dto.getDate() == null)
            throw new BadRequestException("Date is required");
        if (dto.getStatus() == null || dto.getStatus().isBlank())
            throw new BadRequestException("Status is required");

        Long employeeId = dto.getEmployee().getId();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        // Resolve optional time strings → LocalDateTime on the given date
        LocalDateTime checkIn  = parseTime(dto.getDate(), dto.getCheckInTime(),
                                           LocalTime.of(9, 0));   // default 09:00
        LocalDateTime checkOut = dto.getCheckOutTime() != null && !dto.getCheckOutTime().isBlank()
                ? parseTime(dto.getDate(), dto.getCheckOutTime(), null) : null;

        // Upsert: find existing record for employee + date
        Optional<TimeRecord> existing =
                timeRecordRepository.findByEmployee_IdAndDate(employeeId, dto.getDate());

        TimeRecord record = existing.orElseGet(TimeRecord::new);
        record.setEmployee(employee);
        record.setDate(dto.getDate());
        record.setStatus(dto.getStatus());
        record.setCheckIn(checkIn);
        record.setCheckOut(checkOut);
        record.setRemarks(dto.getNotes());
        record.setNotes(dto.getNotes());

        // Auto-calculate hours worked if both times are present
        if (checkOut != null) {
            long minutes = java.time.Duration.between(checkIn, checkOut).toMinutes();
            record.setHoursWorked(minutes > 0 ? Math.round(minutes / 60.0 * 10) / 10.0 : null);
        }

        TimeRecord saved = timeRecordRepository.save(record);
        String msg = existing.isPresent() ? "Attendance updated successfully"
                                          : "Attendance marked successfully";
        return response.send(msg, saved, HttpStatus.OK);
    }

    /** Parse "HH:mm" string into a LocalDateTime on the given date.
     *  Falls back to defaultTime if the string is null/blank. */
    private LocalDateTime parseTime(LocalDate date, String timeStr, LocalTime defaultTime) {
        if (timeStr != null && !timeStr.isBlank()) {
            try {
                return LocalDateTime.of(date, LocalTime.parse(timeStr));
            } catch (Exception ignored) { /* fall through to default */ }
        }
        return defaultTime != null ? LocalDateTime.of(date, defaultTime) : null;
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> getTimeRecordById(Long id) {
        TimeRecord timeRecord = timeRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Time record", id));
        return response.send("Time record fetched successfully", timeRecord, HttpStatus.OK);
    }

    public ResponseEntity<ResponseWrapper> getAllTimeRecords(String sortBy,
                                                              String sortDirection,
                                                              Integer page,
                                                              Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Page<TimeRecord> result = timeRecordRepository.findAll(pageable);
        return response.send("Time records fetched successfully",
                new PageResponse<>(result), HttpStatus.OK);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> updateTimeRecord(Long id, TimeRecord updatedRecord) {
        TimeRecord record = timeRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Time record", id));
        record.setCheckIn(updatedRecord.getCheckIn());
        record.setCheckOut(updatedRecord.getCheckOut());
        record.setDate(updatedRecord.getDate());
        record.setStatus(updatedRecord.getStatus());
        record.setHoursWorked(updatedRecord.getHoursWorked());
        record.setRemarks(updatedRecord.getRemarks());

        if (updatedRecord.getEmployee() != null && updatedRecord.getEmployee().getId() != null) {
            Employee emp = employeeRepository.findById(updatedRecord.getEmployee().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee",
                            updatedRecord.getEmployee().getId()));
            record.setEmployee(emp);
        }

        TimeRecord saved = timeRecordRepository.save(record);
        return response.send("Time record updated successfully", saved, HttpStatus.OK);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> deleteTimeRecord(Long id) {
        if (!timeRecordRepository.existsById(id))
            throw new ResourceNotFoundException("Time record", id);
        timeRecordRepository.deleteById(id);
        return response.send("Time record deleted successfully", null, HttpStatus.OK);
    }

    // ── FILTER ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> filterTimeRecords(Long employeeId,
                                                              String status,
                                                              LocalDate dateFrom,
                                                              LocalDate dateTo,
                                                              String sortBy,
                                                              String sortDirection,
                                                              Integer page,
                                                              Integer size) {
        Pageable pageable = PageableUtils.of(page, size, sortBy, sortDirection, ALLOWED_SORTS);
        Specification<TimeRecord> spec = Specification
                .where(TimeRecordSpecification.hasEmployee(employeeId))
                .and(TimeRecordSpecification.hasStatus(status))
                .and(TimeRecordSpecification.dateFrom(dateFrom))
                .and(TimeRecordSpecification.dateTo(dateTo));
        Page<TimeRecord> result = timeRecordRepository.findAll(spec, pageable);
        return response.send("Time records filtered successfully",
                new PageResponse<>(result), HttpStatus.OK);
    }

}
