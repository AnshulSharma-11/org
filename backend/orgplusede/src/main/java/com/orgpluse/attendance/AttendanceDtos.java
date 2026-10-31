package com.orgpluse.attendance;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Response shapes for the attendance module (all immutable records). */
public final class AttendanceDtos {

    private AttendanceDtos() { }

    /**
     * What the employee's punch card needs.
     * state: NOT_CHECKED_IN | WORKING | ON_BREAK | CHECKED_OUT | ON_LEAVE | RECORDED_BY_HR
     */
    public record TodayDTO(
            Long recordId,
            LocalDate date,
            String state,
            LocalDateTime checkIn,
            LocalDateTime checkOut,
            boolean late,
            long workedSeconds,
            long breakSeconds,
            boolean weekend,
            String shiftStart,
            boolean canCheckIn,
            boolean canCheckOut,
            boolean canStartBreak,
            boolean canResume) { }

    /** Admin stat cards for one day. */
    public record StatsDTO(
            LocalDate date,
            boolean weekend,
            boolean today,
            int expected,
            int present,
            int onTime,
            int late,
            int working,
            int onBreak,
            int onLeave,
            int absent,
            double attendancePercent) { }

    /** One row of the live "who is in right now" table. */
    public record LiveRowDTO(
            Long recordId,
            Long employeeId,
            String employeeCode,
            String name,
            String department,
            String designation,
            LocalDateTime checkIn,
            boolean late,
            String liveStatus,
            long workedSeconds) { }

    public record TrendPointDTO(
            String label,
            int present,
            int absent,
            int late,
            int leave,
            double avgHours) { }

    public record TrendsDTO(
            String range,
            String granularity,
            List<TrendPointDTO> points) { }

    public record CsvExport(String filename, byte[] bytes) { }
}
