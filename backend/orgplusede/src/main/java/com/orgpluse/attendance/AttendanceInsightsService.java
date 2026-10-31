package com.orgpluse.attendance;

import com.orgpluse.attendance.AttendanceDtos.*;
import com.orgpluse.entities.Employee;
import com.orgpluse.entities.Leave;
import com.orgpluse.entities.TimeRecord;
import com.orgpluse.exception.BadRequestException;
import com.orgpluse.repositories.EmployeeRepository;
import com.orgpluse.repositories.LeaveRepository;
import com.orgpluse.repositories.TimeRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin-side attendance views: stat cards, live table, trends and CSV export.
 * Read-only.
 */
@Service
@Transactional(readOnly = true)
public class AttendanceInsightsService {

    private static final int MAX_EXPORT_DAYS = 366;
    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("HH:mm");

    @Autowired private TimeRecordRepository timeRecordRepository;
    @Autowired private EmployeeRepository   employeeRepository;
    @Autowired private LeaveRepository      leaveRepository;
    @Autowired private AttendanceProperties props;

    // ── STATS (cards + on-time/late summary) ──────────────────────────────────
    public StatsDTO stats(LocalDate date, Long departmentId) {
        LocalDate today = props.today();
        LocalDate d = date == null ? today : date;
        boolean weekend = props.isWeekend(d);
        boolean future  = d.isAfter(today);

        List<Employee> expectedList = expectedEmployees(d, departmentId);
        Set<Long> expectedIds = expectedList.stream().map(Employee::getId).collect(Collectors.toSet());

        List<TimeRecord> rows = timeRecordRepository.findDetailedByDate(d).stream()
                .filter(r -> inDepartment(r.getEmployee(), departmentId)).toList();

        Set<Long> presentIds = new HashSet<>();
        int late = 0, working = 0, onBreak = 0;
        Set<Long> leaveIds = new HashSet<>();
        for (TimeRecord r : rows) {
            Long empId = r.getEmployee().getId();
            if (presentLike(r)) {
                presentIds.add(empId);
                if (Boolean.TRUE.equals(r.getLate())) late++;
            }
            if (AttendanceService.WORKING.equals(r.getLiveStatus()))  working++;
            if (AttendanceService.ON_BREAK.equals(r.getLiveStatus())) onBreak++;
            if (AttendanceCalculator.isLeaveStatus(r.getStatus())) leaveIds.add(empId);
        }
        for (Leave l : leaveRepository.findApprovedOverlapping(d, d)) {
            if (inDepartment(l.getEmployee(), departmentId)) leaveIds.add(l.getEmployee().getId());
        }

        int expected = weekend ? 0 : expectedList.size();
        int absent = (weekend || future) ? 0 : (int) expectedIds.stream()
                .filter(id -> !presentIds.contains(id) && !leaveIds.contains(id)).count();
        long presentExpected = presentIds.stream().filter(expectedIds::contains).count();
        double pct = expected > 0 ? Math.round(presentExpected * 1000.0 / expected) / 10.0 : 0.0;

        return new StatsDTO(d, weekend, d.equals(today), expected, presentIds.size(),
                presentIds.size() - late, late, working, onBreak, leaveIds.size(), absent, pct);
    }

    // ── LIVE TABLE ────────────────────────────────────────────────────────────
    public List<LiveRowDTO> live(LocalDate date, Long departmentId) {
        LocalDate d = date == null ? props.today() : date;
        LocalDateTime now = props.now();
        return timeRecordRepository.findDetailedByDate(d).stream()
                .filter(r -> r.getLiveStatus() != null)
                .filter(r -> inDepartment(r.getEmployee(), departmentId))
                .sorted(Comparator.comparing(TimeRecord::getCheckIn,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(r -> {
                    Employee e = r.getEmployee();
                    boolean onBreak = AttendanceService.ON_BREAK.equals(r.getLiveStatus());
                    long worked = AttendanceCalculator.workedSeconds(r.getCheckIn(), now,
                            r.getBreakSeconds(), onBreak ? r.getBreakStartedAt() : null);
                    return new LiveRowDTO(r.getId(), e.getId(), e.getEmployeeCode(), fullName(e),
                            e.getDepartment() == null ? null : e.getDepartment().getName(),
                            e.getDesignation() == null ? null : e.getDesignation().getTitle(),
                            r.getCheckIn(), Boolean.TRUE.equals(r.getLate()), r.getLiveStatus(), worked);
                }).toList();
    }

    // ── TRENDS ────────────────────────────────────────────────────────────────
    private static final class Bucket {
        int present, absent, late, leave, hourCount; double hourSum;
    }

    public TrendsDTO trends(String range, Long departmentId) {
        String r = range == null ? "7d" : range.trim().toLowerCase();
        LocalDate today = props.today();
        LocalDate from;
        boolean monthly = false;
        switch (r) {
            case "7d"  -> from = today.minusDays(6);
            case "30d" -> from = today.minusDays(29);
            case "12m" -> { from = today.withDayOfMonth(1).minusMonths(11); monthly = true; }
            default -> throw new BadRequestException("range must be one of 7d, 30d, 12m");
        }

        Map<LocalDate, List<TimeRecord>> byDate = timeRecordRepository.findDetailedBetween(from, today).stream()
                .filter(t -> inDepartment(t.getEmployee(), departmentId))
                .collect(Collectors.groupingBy(TimeRecord::getDate));

        List<Employee> staff = employeeRepository.findByStatusIgnoreCase("ACTIVE").stream()
                .filter(e -> inDepartment(e, departmentId)).toList();

        Map<LocalDate, Set<Long>> leaveByDay = new HashMap<>();
        for (Leave l : leaveRepository.findApprovedOverlapping(from, today)) {
            if (!inDepartment(l.getEmployee(), departmentId)) continue;
            LocalDate s = l.getStartDate().isBefore(from) ? from : l.getStartDate();
            LocalDate e = l.getEndDate().isAfter(today) ? today : l.getEndDate();
            for (LocalDate x = s; !x.isAfter(e); x = x.plusDays(1))
                leaveByDay.computeIfAbsent(x, k -> new HashSet<>()).add(l.getEmployee().getId());
        }

        Map<String, Bucket> buckets = new LinkedHashMap<>();
        for (LocalDate day = from; !day.isAfter(today); day = day.plusDays(1)) {
            List<TimeRecord> rows = byDate.getOrDefault(day, List.of());
            boolean weekend = props.isWeekend(day);
            if (weekend && rows.isEmpty()) continue;          // skip quiet weekend days

            Set<Long> presentIds = new HashSet<>();
            Set<Long> leaveIds = new HashSet<>(leaveByDay.getOrDefault(day, Set.of()));
            int late = 0;
            Bucket b = buckets.computeIfAbsent(
                    monthly ? YearMonth.from(day).toString() : day.toString(), k -> new Bucket());
            for (TimeRecord t : rows) {
                Long empId = t.getEmployee().getId();
                if (presentLike(t)) { presentIds.add(empId); if (Boolean.TRUE.equals(t.getLate())) late++; }
                if (AttendanceCalculator.isLeaveStatus(t.getStatus())) leaveIds.add(empId);
                if (t.getHoursWorked() != null && t.getHoursWorked() > 0) {
                    b.hourSum += t.getHoursWorked(); b.hourCount++;
                }
            }
            int absent = 0;
            if (!weekend && !day.equals(today)) {              // today is not over yet
                final LocalDate dd = day;
                absent = (int) staff.stream().filter(e -> isEmployedOn(e, dd))
                        .map(Employee::getId)
                        .filter(id -> !presentIds.contains(id) && !leaveIds.contains(id)).count();
            }
            b.present += presentIds.size();
            b.late    += late;
            b.leave   += leaveIds.size();
            b.absent  += absent;
        }

        List<TrendPointDTO> points = buckets.entrySet().stream().map(en -> {
            Bucket b = en.getValue();
            double avg = b.hourCount > 0 ? Math.round(b.hourSum / b.hourCount * 100.0) / 100.0 : 0.0;
            return new TrendPointDTO(en.getKey(), b.present, b.absent, b.late, b.leave, avg);
        }).toList();

        return new TrendsDTO(r, monthly ? "month" : "day", points);
    }

    // ── CSV EXPORT ────────────────────────────────────────────────────────────
    public CsvExport exportCsv(LocalDate from, LocalDate to, String status,
                               Long departmentId, Long employeeId) {
        LocalDate today = props.today();
        LocalDate f = from != null ? from : (to != null ? to : today);
        LocalDate t = to != null ? to : f;
        if (t.isBefore(f)) throw new BadRequestException("'to' date must not be before 'from' date");
        if (ChronoUnit.DAYS.between(f, t) + 1 > MAX_EXPORT_DAYS)
            throw new BadRequestException("Export range cannot exceed " + MAX_EXPORT_DAYS + " days");

        List<TimeRecord> rows = timeRecordRepository.findDetailedBetween(f, t).stream()
                .filter(r -> inDepartment(r.getEmployee(), departmentId))
                .filter(r -> employeeId == null || employeeId.equals(r.getEmployee().getId()))
                .filter(r -> status == null || status.isBlank() || status.equalsIgnoreCase(r.getStatus()))
                .toList();

        StringBuilder sb = new StringBuilder("\uFEFF");   // BOM so Excel reads UTF-8
        sb.append("Employee Code,Employee,Department,Designation,Date,Status,Late,")
          .append("Check In,Check Out,Break (min),Hours Worked,Remarks\r\n");
        for (TimeRecord r : rows) {
            Employee e = r.getEmployee();
            sb.append(String.join(",",
                    csv(e.getEmployeeCode()),
                    csv(fullName(e)),
                    csv(e.getDepartment() == null ? null : e.getDepartment().getName()),
                    csv(e.getDesignation() == null ? null : e.getDesignation().getTitle()),
                    csv(r.getDate()),
                    csv(r.getStatus()),
                    csv(Boolean.TRUE.equals(r.getLate()) ? "Yes" : "No"),
                    csv(r.getCheckIn() == null ? null : r.getCheckIn().format(HM)),
                    csv(r.getCheckOut() == null ? null : r.getCheckOut().format(HM)),
                    csv(r.getBreakSeconds() == null ? 0 : Math.round(r.getBreakSeconds() / 60.0)),
                    csv(r.getHoursWorked()),
                    csv(r.getRemarks()))).append("\r\n");
        }
        String name = "attendance_" + f + (t.equals(f) ? "" : "_to_" + t) + ".csv";
        return new CsvExport(name, sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static boolean presentLike(TimeRecord r) {
        return r.getCheckIn() != null
                && ("PRESENT".equalsIgnoreCase(r.getStatus()) || "HALF_DAY".equalsIgnoreCase(r.getStatus()));
    }

    private static boolean inDepartment(Employee e, Long departmentId) {
        if (departmentId == null) return true;
        return e.getDepartment() != null && departmentId.equals(e.getDepartment().getId());
    }

    private static boolean isEmployedOn(Employee e, LocalDate d) {
        return (e.getHireDate() == null || !e.getHireDate().isAfter(d))
            && (e.getTerminationDate() == null || !e.getTerminationDate().isBefore(d));
    }

    private List<Employee> expectedEmployees(LocalDate d, Long departmentId) {
        return employeeRepository.findByStatusIgnoreCase("ACTIVE").stream()
                .filter(e -> inDepartment(e, departmentId))
                .filter(e -> isEmployedOn(e, d))
                .toList();
    }

    private static String fullName(Employee e) {
        return ((e.getFirstName() == null ? "" : e.getFirstName()) + " "
              + (e.getLastName()  == null ? "" : e.getLastName())).trim();
    }

    /** RFC-4180 quoting + guard against spreadsheet formula injection (=, +, -, @). */
    static String csv(Object o) {
        if (o == null) return "";
        String s = String.valueOf(o);
        if (!s.isEmpty() && "=+-@\t\r".indexOf(s.charAt(0)) >= 0) s = "'" + s;
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r"))
            s = "\"" + s.replace("\"", "\"\"") + "\"";
        return s;
    }
}
