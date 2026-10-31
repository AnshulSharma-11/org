package com.orgpluse.attendance;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

class AttendanceCalculatorTest {

    private static final LocalTime SHIFT = LocalTime.of(10, 0);

    @Test
    void onTimeAtExactlyShiftStart() {
        assertFalse(AttendanceCalculator.isLate(LocalTime.of(10, 0), SHIFT, 0));
    }

    @Test
    void lateOneMinuteAfterShiftStart() {
        assertTrue(AttendanceCalculator.isLate(LocalTime.of(10, 1), SHIFT, 0));
    }

    @Test
    void graceWindowIsRespected() {
        assertFalse(AttendanceCalculator.isLate(LocalTime.of(10, 10), SHIFT, 10));
        assertTrue(AttendanceCalculator.isLate(LocalTime.of(10, 11), SHIFT, 10));
    }

    @Test
    void workedSecondsDeductsCompletedBreaks() {
        LocalDateTime in  = LocalDateTime.of(2026, 10, 30, 9, 0);
        LocalDateTime out = LocalDateTime.of(2026, 10, 30, 18, 0);
        // 9h on site, 1h of breaks -> 8h
        assertEquals(8 * 3600, AttendanceCalculator.workedSeconds(in, out, 3600L, null));
        assertEquals(8.0, AttendanceCalculator.toHours(8 * 3600));
    }

    @Test
    void workedSecondsDeductsRunningBreak() {
        LocalDateTime in  = LocalDateTime.of(2026, 10, 30, 9, 0);
        LocalDateTime now = LocalDateTime.of(2026, 10, 30, 13, 0);
        LocalDateTime breakStart = LocalDateTime.of(2026, 10, 30, 12, 30);
        // 4h on site, 30 min running break -> 3.5h
        assertEquals(3 * 3600 + 1800, AttendanceCalculator.workedSeconds(in, now, 0L, breakStart));
    }

    @Test
    void workedSecondsNeverNegativeAndNullSafe() {
        LocalDateTime in = LocalDateTime.of(2026, 10, 30, 9, 0);
        assertEquals(0, AttendanceCalculator.workedSeconds(in, in.plusMinutes(10), 7200L, null));
        assertEquals(0, AttendanceCalculator.workedSeconds(null, in, null, null));
        assertEquals(0, AttendanceCalculator.secondsBetween(in, in.minusHours(1)));
    }

    @Test
    void leaveStatusAcceptsLegacyValue() {
        assertTrue(AttendanceCalculator.isLeaveStatus("ON_LEAVE"));
        assertTrue(AttendanceCalculator.isLeaveStatus("leave"));
        assertFalse(AttendanceCalculator.isLeaveStatus("PRESENT"));
        assertFalse(AttendanceCalculator.isLeaveStatus(null));
    }

    @Test
    void hoursRoundTo2Decimals() {
        assertEquals(1.34, AttendanceCalculator.toHours(4820));   // 1.3388…h
    }

    @Test
    void csvEscapingAndFormulaGuard() {
        assertEquals("", AttendanceInsightsService.csv(null));
        assertEquals("plain", AttendanceInsightsService.csv("plain"));
        assertEquals("\"a,b\"", AttendanceInsightsService.csv("a,b"));
        assertEquals("\"say \"\"hi\"\"\"", AttendanceInsightsService.csv("say \"hi\""));
        assertEquals("'=SUM(A1)", AttendanceInsightsService.csv("=SUM(A1)"));
        assertEquals("'@cmd", AttendanceInsightsService.csv("@cmd"));
    }
}
