package com.orgpluse.attendance;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.EnumSet;
import java.util.Set;

/**
 * Attendance settings, read from application.properties (all optional).
 *
 *   attendance.zone          IANA zone used for "now" / "today"   (default Asia/Kolkata)
 *   attendance.shift-start   HH:mm — check-ins after this are late (default 10:00)
 *   attendance.grace-minutes minutes of grace after shift start    (default 0)
 *   attendance.weekend-days  comma separated DayOfWeek names       (default SATURDAY,SUNDAY)
 */
@Component
public class AttendanceProperties {

    private final ZoneId zone;
    private final LocalTime shiftStart;
    private final int graceMinutes;
    private final Set<DayOfWeek> weekendDays;

    public AttendanceProperties(
            @Value("${attendance.zone:Asia/Kolkata}") String zone,
            @Value("${attendance.shift-start:10:00}") String shiftStart,
            @Value("${attendance.grace-minutes:0}") int graceMinutes,
            @Value("${attendance.weekend-days:SATURDAY,SUNDAY}") String weekendDays) {
        this.zone = ZoneId.of(zone.trim());
        this.shiftStart = LocalTime.parse(shiftStart.trim());
        this.graceMinutes = Math.max(0, graceMinutes);
        Set<DayOfWeek> days = EnumSet.noneOf(DayOfWeek.class);
        for (String d : weekendDays.split(",")) {
            if (!d.isBlank()) days.add(DayOfWeek.valueOf(d.trim().toUpperCase()));
        }
        this.weekendDays = days;
    }

    public LocalDateTime now()           { return LocalDateTime.now(zone); }
    public LocalDate today()             { return LocalDate.now(zone); }
    public LocalTime shiftStart()        { return shiftStart; }
    public int graceMinutes()            { return graceMinutes; }
    public boolean isWeekend(LocalDate d){ return weekendDays.contains(d.getDayOfWeek()); }
}
