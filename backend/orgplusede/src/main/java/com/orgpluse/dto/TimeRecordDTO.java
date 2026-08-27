package com.orgpluse.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * Used by POST /api/v1/admin/time-records (markAttendance upsert).
 * checkInTime / checkOutTime are optional "HH:mm" strings.
 */
@Data
public class TimeRecordDTO {

    private EmployeeRef employee;
    private LocalDate   date;
    private String      status;       // PRESENT | ABSENT | HALF_DAY | LEAVE
    private String      checkInTime;  // optional "HH:mm"
    private String      checkOutTime; // optional "HH:mm"
    private String      notes;

    @Data
    public static class EmployeeRef {
        private Long id;
    }
}
