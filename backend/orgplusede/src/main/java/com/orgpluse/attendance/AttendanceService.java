package com.orgpluse.attendance;

import com.orgpluse.attendance.AttendanceDtos.TodayDTO;
import com.orgpluse.entities.Employee;
import com.orgpluse.entities.TimeRecord;
import com.orgpluse.exception.BadRequestException;
import com.orgpluse.exception.ConflictException;
import com.orgpluse.exception.ResourceNotFoundException;
import com.orgpluse.repositories.EmployeeRepository;
import com.orgpluse.repositories.LeaveRepository;
import com.orgpluse.repositories.TimeRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Employee self-service attendance: check-in, break, resume, check-out.
 *
 * Every mutating call first takes a row lock on the employee so double-clicks or two
 * browser tabs cannot create duplicate records for the same day.
 */
@Service
public class AttendanceService {

    public static final String WORKING  = "WORKING";
    public static final String ON_BREAK = "ON_BREAK";

    @Autowired private TimeRecordRepository timeRecordRepository;
    @Autowired private EmployeeRepository   employeeRepository;
    @Autowired private LeaveRepository      leaveRepository;
    @Autowired private AttendanceProperties props;

    // ── CHECK IN ──────────────────────────────────────────────────────────────
    @Transactional
    public TodayDTO checkIn(Long employeeId) {
        Employee emp = lockEmployee(employeeId);
        if (!"ACTIVE".equalsIgnoreCase(emp.getStatus()))
            throw new BadRequestException("Only ACTIVE employees can check in");

        LocalDate today = props.today();
        LocalDateTime now = props.now();

        closeStaleSessions(employeeId, today);

        if (leaveRepository.existsApprovedOn(employeeId, today))
            throw new ConflictException("You are on approved leave today — check-in is not allowed");

        TimeRecord rec = timeRecordRepository
                .findFirstByEmployee_IdAndDateOrderByIdAsc(employeeId, today).orElse(null);

        if (rec == null) {
            rec = new TimeRecord();
            rec.setEmployee(emp);
            rec.setDate(today);
            startFreshSession(rec, now);
        } else {
            if (AttendanceCalculator.isLeaveStatus(rec.getStatus()))
                throw new ConflictException("You are marked on leave today — check-in is not allowed");
            if (rec.getLiveStatus() != null)
                throw new ConflictException("You are already checked in");

            boolean selfTracked = rec.getBreakSeconds() != null;
            if (selfTracked && rec.getCheckOut() != null) {
                // Came back after checking out: the gap counts as a break
                rec.setBreakSeconds(rec.getBreakSeconds()
                        + AttendanceCalculator.secondsBetween(rec.getCheckOut(), now));
                rec.setCheckOut(null);
                rec.setHoursWorked(null);
                rec.setLiveStatus(WORKING);
            } else if (isPresentLike(rec) && rec.getCheckIn() != null && !selfTracked) {
                throw new ConflictException("Your attendance for today was already recorded by HR");
            } else {
                startFreshSession(rec, now);   // e.g. HR had marked ABSENT earlier
            }
        }
        return toToday(timeRecordRepository.save(rec), today, now, false);
    }

    // ── START BREAK ───────────────────────────────────────────────────────────
    @Transactional
    public TodayDTO startBreak(Long employeeId) {
        lockEmployee(employeeId);
        LocalDate today = props.today();
        LocalDateTime now = props.now();
        TimeRecord rec = requireLiveSession(employeeId, today);
        if (!WORKING.equals(rec.getLiveStatus()))
            throw new ConflictException("You are already on a break");
        rec.setLiveStatus(ON_BREAK);
        rec.setBreakStartedAt(now);
        return toToday(timeRecordRepository.save(rec), today, now, false);
    }

    // ── RESUME WORK ───────────────────────────────────────────────────────────
    @Transactional
    public TodayDTO resumeWork(Long employeeId) {
        lockEmployee(employeeId);
        LocalDate today = props.today();
        LocalDateTime now = props.now();
        TimeRecord rec = requireLiveSession(employeeId, today);
        if (!ON_BREAK.equals(rec.getLiveStatus()))
            throw new ConflictException("You are not on a break");
        endBreak(rec, now);
        rec.setLiveStatus(WORKING);
        return toToday(timeRecordRepository.save(rec), today, now, false);
    }

    // ── CHECK OUT ─────────────────────────────────────────────────────────────
    @Transactional
    public TodayDTO checkOut(Long employeeId) {
        lockEmployee(employeeId);
        LocalDate today = props.today();
        LocalDateTime now = props.now();
        TimeRecord rec = requireLiveSession(employeeId, today);
        if (ON_BREAK.equals(rec.getLiveStatus())) endBreak(rec, now);   // close a running break

        rec.setCheckOut(now);
        rec.setLiveStatus(null);
        rec.setHoursWorked(AttendanceCalculator.toHours(
                AttendanceCalculator.workedSeconds(rec.getCheckIn(), now, rec.getBreakSeconds(), null)));
        return toToday(timeRecordRepository.save(rec), today, now, false);
    }

    // ── TODAY (read) ──────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public TodayDTO today(Long employeeId) {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        LocalDate today = props.today();
        TimeRecord rec = timeRecordRepository
                .findFirstByEmployee_IdAndDateOrderByIdAsc(employeeId, today).orElse(null);
        boolean onLeave = leaveRepository.existsApprovedOn(employeeId, today);
        return toToday(rec, today, props.now(), onLeave);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Employee lockEmployee(Long employeeId) {
        return employeeRepository.findByIdForUpdate(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
    }

    private TimeRecord requireLiveSession(Long employeeId, LocalDate today) {
        TimeRecord rec = timeRecordRepository
                .findFirstByEmployee_IdAndDateOrderByIdAsc(employeeId, today).orElse(null);
        if (rec == null || rec.getLiveStatus() == null)
            throw new ConflictException("You are not checked in");
        return rec;
    }

    private void startFreshSession(TimeRecord rec, LocalDateTime now) {
        boolean late = !props.isWeekend(now.toLocalDate())
                && AttendanceCalculator.isLate(now.toLocalTime(), props.shiftStart(), props.graceMinutes());
        rec.setStatus("PRESENT");
        rec.setCheckIn(now);
        rec.setCheckOut(null);
        rec.setHoursWorked(null);
        rec.setLate(late);
        rec.setLiveStatus(WORKING);
        rec.setBreakStartedAt(null);
        rec.setBreakSeconds(0L);
    }

    private void endBreak(TimeRecord rec, LocalDateTime now) {
        if (rec.getBreakStartedAt() != null) {
            long add = AttendanceCalculator.secondsBetween(rec.getBreakStartedAt(), now);
            rec.setBreakSeconds((rec.getBreakSeconds() == null ? 0L : rec.getBreakSeconds()) + add);
        }
        rec.setBreakStartedAt(null);
    }

    /** A session left open on an earlier day (forgot to check out) must not block today. */
    private void closeStaleSessions(Long employeeId, LocalDate today) {
        for (TimeRecord stale : timeRecordRepository
                .findByEmployee_IdAndDateBeforeAndLiveStatusIsNotNull(employeeId, today)) {
            stale.setLiveStatus(null);
            stale.setBreakStartedAt(null);
            String note = "No check-out recorded (session auto-closed)";
            stale.setRemarks(stale.getRemarks() == null || stale.getRemarks().isBlank()
                    ? note : stale.getRemarks() + " | " + note);
            timeRecordRepository.save(stale);
        }
    }

    private static boolean isPresentLike(TimeRecord r) {
        return "PRESENT".equalsIgnoreCase(r.getStatus()) || "HALF_DAY".equalsIgnoreCase(r.getStatus());
    }

    private TodayDTO toToday(TimeRecord rec, LocalDate today, LocalDateTime now, boolean onApprovedLeave) {
        boolean weekend = props.isWeekend(today);
        String shift = props.shiftStart().toString();

        boolean onLeave = onApprovedLeave || (rec != null && AttendanceCalculator.isLeaveStatus(rec.getStatus()));
        if (onLeave) {
            return new TodayDTO(rec == null ? null : rec.getId(), today, "ON_LEAVE",
                    null, null, false, 0, 0, weekend, shift, false, false, false, false);
        }
        if (rec == null || !isPresentLike(rec) || rec.getCheckIn() == null) {
            return new TodayDTO(rec == null ? null : rec.getId(), today, "NOT_CHECKED_IN",
                    null, null, false, 0, 0, weekend, shift, true, false, false, false);
        }

        boolean late = Boolean.TRUE.equals(rec.getLate());
        String live = rec.getLiveStatus();
        long breakSecs = rec.getBreakSeconds() == null ? 0L : rec.getBreakSeconds();

        if (WORKING.equals(live)) {
            long worked = AttendanceCalculator.workedSeconds(rec.getCheckIn(), now, breakSecs, null);
            return new TodayDTO(rec.getId(), today, "WORKING", rec.getCheckIn(), null, late,
                    worked, breakSecs, weekend, shift, false, true, true, false);
        }
        if (ON_BREAK.equals(live)) {
            long worked = AttendanceCalculator.workedSeconds(rec.getCheckIn(), now, breakSecs, rec.getBreakStartedAt());
            long running = rec.getBreakStartedAt() == null ? 0
                    : AttendanceCalculator.secondsBetween(rec.getBreakStartedAt(), now);
            return new TodayDTO(rec.getId(), today, "ON_BREAK", rec.getCheckIn(), null, late,
                    worked, breakSecs + running, weekend, shift, false, true, false, true);
        }
        if (rec.getCheckOut() != null) {
            long worked = AttendanceCalculator.workedSeconds(rec.getCheckIn(), rec.getCheckOut(), breakSecs, null);
            boolean selfTracked = rec.getBreakSeconds() != null;
            return new TodayDTO(rec.getId(), today, "CHECKED_OUT", rec.getCheckIn(), rec.getCheckOut(), late,
                    worked, breakSecs, weekend, shift, selfTracked, false, false, false);
        }
        // Present, no check-out, no live session → entered by HR
        return new TodayDTO(rec.getId(), today, "RECORDED_BY_HR", rec.getCheckIn(), null, late,
                0, breakSecs, weekend, shift, false, false, false, false);
    }
}
