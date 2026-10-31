package com.orgpluse.attendance;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Pure attendance maths — no Spring, no database — so it is trivial to unit test.
 */
public final class AttendanceCalculator {

    private AttendanceCalculator() { }

    /** Late if the check-in time is strictly after shiftStart + grace. */
    public static boolean isLate(LocalTime checkIn, LocalTime shiftStart, int graceMinutes) {
        return checkIn.isAfter(shiftStart.plusMinutes(graceMinutes));
    }

    /**
     * Seconds actually worked between checkIn and end, minus completed breaks and
     * (if a break is still running) the running break up to end. Never negative.
     */
    public static long workedSeconds(LocalDateTime checkIn, LocalDateTime end,
                                     Long completedBreakSeconds, LocalDateTime activeBreakStart) {
        if (checkIn == null || end == null) return 0;
        long total  = Duration.between(checkIn, end).getSeconds();
        long breaks = completedBreakSeconds == null ? 0 : completedBreakSeconds;
        if (activeBreakStart != null) {
            breaks += Math.max(0, Duration.between(activeBreakStart, end).getSeconds());
        }
        return Math.max(0, total - breaks);
    }

    /** Hours rounded to 2 decimals. */
    public static double toHours(long seconds) {
        return Math.round(seconds / 3600.0 * 100.0) / 100.0;
    }

    /** HR leave status. Older rows were saved as "LEAVE" by a dropdown bug; accept both. */
    public static boolean isLeaveStatus(String status) {
        return "ON_LEAVE".equalsIgnoreCase(status) || "LEAVE".equalsIgnoreCase(status);
    }

    /** Seconds between two instants, never negative. */
    public static long secondsBetween(LocalDateTime from, LocalDateTime to) {
        return Math.max(0, Duration.between(from, to).getSeconds());
    }
}
