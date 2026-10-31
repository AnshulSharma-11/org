package com.orgpluse.attendance;

import com.orgpluse.attendance.AttendanceDtos.*;
import com.orgpluse.entities.*;
import com.orgpluse.exception.*;
import com.orgpluse.repositories.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.lang.reflect.*;
import java.time.*;
import java.util.*;
import java.util.stream.*;

/**
 * End-to-end behaviour of AttendanceService + AttendanceInsightsService against
 * in-memory repositories (java.lang.reflect.Proxy) and a controllable clock.
 * No database or Spring context needed.
 */
class AttendanceScenarioTest {
  static void check(boolean c, String n){ assertTrue(c, n); }
  static void expectConflict(Runnable r, String n){ assertThrows(ConflictException.class, r::run, n); }

  static class Clock extends AttendanceProperties {
    LocalDateTime now;
    Clock(LocalDateTime n){ super("Asia/Kolkata","10:00",0,"SATURDAY,SUNDAY"); now=n; }
    @Override public LocalDateTime now(){ return now; }
    @Override public LocalDate today(){ return now.toLocalDate(); }
  }

  static List<TimeRecord> records = new ArrayList<>();
  static Map<Long,Employee> emps = new LinkedHashMap<>();
  static List<Leave> leaves = new ArrayList<>();
  static long seq = 1;

  @SuppressWarnings("unchecked")
  static <T> T proxy(Class<T> c, InvocationHandler h){ return (T) Proxy.newProxyInstance(c.getClassLoader(), new Class[]{c}, h); }

  static Employee emp(long id, String code, String first, String status, Department d){
    Employee e = new Employee(); e.setId(id); e.setEmployeeCode(code); e.setFirstName(first); e.setLastName("T");
    e.setStatus(status); e.setHireDate(LocalDate.of(2020,1,1)); e.setDepartment(d); emps.put(id,e); return e;
  }
  static Leave leave(Employee e, LocalDate s, LocalDate t){ Leave l=new Leave(); l.setEmployee(e); l.setStartDate(s); l.setEndDate(t); l.setStatus("APPROVED"); leaves.add(l); return l; }
  static boolean covers(Leave l, LocalDate d){ return !l.getStartDate().isAfter(d) && !l.getEndDate().isBefore(d); }

  static void set(Object o, String f, Object v) throws Exception { Field x=o.getClass().getDeclaredField(f); x.setAccessible(true); x.set(o,v); }

  @Test
  void fullScenario() throws Exception {
    records.clear(); emps.clear(); leaves.clear(); seq = 1;
    TimeRecordRepository trr = proxy(TimeRecordRepository.class, (p,m,args)->{
      switch(m.getName()){
        case "save": { TimeRecord r=(TimeRecord)args[0]; if(r.getId()==null){r.setId(seq++); records.add(r);} return r; }
        case "findFirstByEmployee_IdAndDateOrderByIdAsc": return records.stream().filter(r->r.getEmployee().getId().equals(args[0])&&r.getDate().equals(args[1])).findFirst();
        case "findByEmployee_IdAndDateBeforeAndLiveStatusIsNotNull": return records.stream().filter(r->r.getEmployee().getId().equals(args[0])&&r.getDate().isBefore((LocalDate)args[1])&&r.getLiveStatus()!=null).collect(Collectors.toList());
        case "findDetailedByDate": return records.stream().filter(r->r.getDate().equals(args[0])).collect(Collectors.toList());
        case "findDetailedBetween": return records.stream().filter(r->!r.getDate().isBefore((LocalDate)args[0])&&!r.getDate().isAfter((LocalDate)args[1])).collect(Collectors.toList());
        default: return m.getName().equals("hashCode")?1:(m.getName().equals("equals")?false:m.getName().equals("toString")?"trr":null);
      }});
    EmployeeRepository er = proxy(EmployeeRepository.class, (p,m,args)->{
      switch(m.getName()){
        case "findByIdForUpdate": case "findById": return Optional.ofNullable(emps.get(args[0]));
        case "findByStatusIgnoreCase": return emps.values().stream().filter(e->e.getStatus().equalsIgnoreCase((String)args[0])).collect(Collectors.toList());
        default: return m.getName().equals("hashCode")?2:(m.getName().equals("equals")?false:m.getName().equals("toString")?"er":null);
      }});
    LeaveRepository lr = proxy(LeaveRepository.class, (p,m,args)->{
      switch(m.getName()){
        case "existsApprovedOn": return leaves.stream().anyMatch(l->l.getEmployee().getId().equals(args[0])&&covers(l,(LocalDate)args[1]));
        case "findApprovedOverlapping": return leaves.stream().filter(l->!l.getStartDate().isAfter((LocalDate)args[1])&&!l.getEndDate().isBefore((LocalDate)args[0])).collect(Collectors.toList());
        default: return m.getName().equals("hashCode")?3:(m.getName().equals("equals")?false:m.getName().equals("toString")?"lr":null);
      }});

    Department eng = new Department(); eng.setId(1L); eng.setName("Eng");
    Department ops = new Department(); ops.setId(2L); ops.setName("Ops");
    Employee asha = emp(1,"E1","Asha","ACTIVE",eng);
    Employee ravi = emp(2,"E2","Ravi","ACTIVE",eng);
    Employee meena= emp(3,"E3","Meena","ACTIVE",ops);
    Employee gone = emp(4,"E4","Gone","INACTIVE",ops);

    Clock clk = new Clock(LocalDateTime.of(2026,10,30,10,5));   // Friday
    AttendanceService svc = new AttendanceService();
    set(svc,"timeRecordRepository",trr); set(svc,"employeeRepository",er); set(svc,"leaveRepository",lr); set(svc,"props",clk);
    AttendanceInsightsService ins = new AttendanceInsightsService();
    set(ins,"timeRecordRepository",trr); set(ins,"employeeRepository",er); set(ins,"leaveRepository",lr); set(ins,"props",clk);

    // 1 check in late
    TodayDTO t = svc.checkIn(1L);
    check(t.state().equals("WORKING") && t.late(), "check-in at 10:05 -> WORKING + late");
    check(t.canCheckOut() && t.canStartBreak() && !t.canCheckIn(), "buttons: out+break only");
    expectConflict(()->svc.checkIn(1L), "double check-in rejected");
    check(records.size()==1, "only one record created");

    // 2 break 12:00-12:30, checkout 18:05
    clk.now = LocalDateTime.of(2026,10,30,12,0);  t = svc.startBreak(1L);
    check(t.state().equals("ON_BREAK") && t.canResume(), "start break -> ON_BREAK");
    expectConflict(()->svc.startBreak(1L), "second break while on break rejected");
    clk.now = LocalDateTime.of(2026,10,30,12,30); t = svc.resumeWork(1L);
    check(t.state().equals("WORKING") && t.breakSeconds()==1800, "resume -> 30 min break recorded");
    expectConflict(()->svc.resumeWork(1L), "resume when not on break rejected");
    clk.now = LocalDateTime.of(2026,10,30,18,5);  t = svc.checkOut(1L);
    TimeRecord r1 = records.get(0);
    check(t.state().equals("CHECKED_OUT") && r1.getHoursWorked()==7.5, "check-out -> 7.5h (8h on site - 30m break), got "+r1.getHoursWorked());
    check(r1.getLiveStatus()==null, "live status cleared");
    expectConflict(()->svc.checkOut(1L), "check-out twice rejected");

    // 3 return same day: gap counts as break
    clk.now = LocalDateTime.of(2026,10,30,19,5);  t = svc.checkIn(1L);
    check(t.state().equals("WORKING") && r1.getBreakSeconds()==1800+3600, "re-check-in adds 1h gap to break");
    check(r1.getCheckIn().toLocalTime().equals(LocalTime.of(10,5)), "original check-in kept");
    clk.now = LocalDateTime.of(2026,10,30,20,5);  svc.checkOut(1L);
    check(r1.getHoursWorked()==8.5, "second checkout -> 8.5h (10h - 1.5h), got "+r1.getHoursWorked());

    // 4 on time check-in, break auto-closed by checkout
    clk.now = LocalDateTime.of(2026,10,30,9,50);  t = svc.checkIn(2L);
    check(!t.late(), "09:50 on time");
    clk.now = LocalDateTime.of(2026,10,30,13,0);  svc.startBreak(2L);
    clk.now = LocalDateTime.of(2026,10,30,13,20); t = svc.checkOut(2L);
    TimeRecord r2 = records.stream().filter(r->r.getEmployee().getId()==2L).findFirst().get();
    check(r2.getBreakSeconds()==1200 && r2.getHoursWorked()==3.17, "checkout while on break closes break (20m); 3.5h on site - 20m = 3.17h, got "+r2.getHoursWorked());

    // 5 leave block
    leave(meena, LocalDate.of(2026,10,30), LocalDate.of(2026,10,30));
    clk.now = LocalDateTime.of(2026,10,30,10,0);
    expectConflict(()->svc.checkIn(3L), "check-in blocked on approved leave");
    check(svc.today(3L).state().equals("ON_LEAVE"), "today() reports ON_LEAVE");

    // 6 inactive employee
    try { svc.checkIn(4L); check(false,"inactive blocked"); } catch (BadRequestException e) { check(true,"inactive employee blocked"); }

    // 7 HR-recorded present blocks self check-in; HR absent allows it
    Employee hrOne = emp(5,"E5","Hr","ACTIVE",eng);
    TimeRecord hr = new TimeRecord(); hr.setEmployee(hrOne); hr.setDate(LocalDate.of(2026,10,30)); hr.setStatus("PRESENT");
    hr.setCheckIn(LocalDateTime.of(2026,10,30,9,0)); hr.setCheckOut(LocalDateTime.of(2026,10,30,17,0)); hr.setHoursWorked(8.0); hr.setId(seq++); records.add(hr);
    expectConflict(()->svc.checkIn(5L), "HR-recorded PRESENT blocks self check-in");
    check(svc.today(5L).state().equals("CHECKED_OUT") && !svc.today(5L).canCheckIn(), "HR closed record shown as checked out, no check-in button");
    Employee hrAbs = emp(6,"E6","Abs","ACTIVE",eng);
    TimeRecord ab = new TimeRecord(); ab.setEmployee(hrAbs); ab.setDate(LocalDate.of(2026,10,30)); ab.setStatus("ABSENT");
    ab.setCheckIn(LocalDateTime.of(2026,10,30,9,0)); ab.setId(seq++); records.add(ab);
    check(svc.today(6L).state().equals("NOT_CHECKED_IN") && svc.today(6L).canCheckIn(), "HR ABSENT -> can still check in");
    clk.now = LocalDateTime.of(2026,10,30,11,0);
    t = svc.checkIn(6L);
    check(t.state().equals("WORKING") && ab.getStatus().equals("PRESENT") && ab.getLate(), "check-in overrides ABSENT, flagged late");

    // 8 stale session from yesterday auto-closed
    Employee st = emp(7,"E7","Stale","ACTIVE",eng);
    TimeRecord stale = new TimeRecord(); stale.setEmployee(st); stale.setDate(LocalDate.of(2026,10,29)); stale.setStatus("PRESENT");
    stale.setCheckIn(LocalDateTime.of(2026,10,29,9,0)); stale.setLiveStatus("WORKING"); stale.setBreakSeconds(0L); stale.setId(seq++); records.add(stale);
    clk.now = LocalDateTime.of(2026,10,30,9,30);
    svc.checkIn(7L);
    check(stale.getLiveStatus()==null && stale.getRemarks()!=null && stale.getRemarks().contains("auto-closed"), "stale yesterday session auto-closed with remark");

    // 9 stats (Friday 30th). expected = ACTIVE & employed: 1,2,3,5,6,7 = 6
    clk.now = LocalDateTime.of(2026,10,30,14,0);
    StatsDTO s = ins.stats(null, null);
    check(s.expected()==6, "expected = 6 active employees");
    check(s.present()==5, "present = 5 (1,2,5,6,7), got "+s.present());
    check(s.late()==2, "late = 2 (E1 + E6), got "+s.late());
    check(s.onLeave()==1, "on leave = 1 (Meena)");
    check(s.absent()==0, "absent/not-checked-in = 0 (everyone accounted), got "+s.absent());
    check(s.working()==2 && s.onBreak()==0, "working now = 2 (E6,E7)");
    check(s.attendancePercent()==83.3, "attendance % = 83.3 (5/6), got "+s.attendancePercent());
    StatsDTO sd = ins.stats(null, 2L);
    check(sd.expected()==1 && sd.present()==0 && sd.onLeave()==1 && sd.absent()==0, "department filter (Ops): expected 1, on leave 1");
    StatsDTO sat = ins.stats(LocalDate.of(2026,10,31), null);
    check(sat.weekend() && sat.expected()==0 && sat.absent()==0, "Saturday: weekend, nobody expected");
    StatsDTO past = ins.stats(LocalDate.of(2026,10,28), null);
    check(past.absent()==6 && past.present()==0 && past.onLeave()==0 && !past.today(), "past day, no records, no leave: all 6 absent, got absent="+past.absent());

    // 10 live table
    List<LiveRowDTO> live = ins.live(null, null);
    check(live.size()==2 && live.get(0).name().startsWith("Stale"), "live table: 2 rows sorted by check-in (09:30 first)");
    check(live.get(1).late() && live.get(1).workedSeconds()==3*3600, "live row: late flag + 3h worked, got "+live.get(1).workedSeconds());

    // 11 trends
    TrendsDTO tr = ins.trends("7d", null);
    check(tr.granularity().equals("day") && !tr.points().isEmpty(), "7d trends returns day points: "+tr.points().size()+" points");
    TrendPointDTO today = tr.points().stream().filter(p->p.label().equals("2026-10-30")).findFirst().get();
    check(today.present()==5 && today.late()==2 && today.leave()==1 && today.absent()==0, "today point correct (absent not counted for today)");
    check(tr.points().stream().noneMatch(p->p.label().equals("2026-10-25")||p.label().equals("2026-10-31")), "quiet weekend days skipped");
    TrendsDTO tm = ins.trends("12m", null);
    check(tm.granularity().equals("month") && tm.points().stream().anyMatch(p->p.label().equals("2026-10")), "12m returns monthly buckets");
    try { ins.trends("5y", null); check(false,"bad range"); } catch (BadRequestException e) { check(true,"bad range rejected"); }

    // 12 CSV
    CsvExport csv = ins.exportCsv(LocalDate.of(2026,10,30), null, null, null, null);
    String body = new String(csv.bytes(), java.nio.charset.StandardCharsets.UTF_8);
    check(csv.filename().equals("attendance_2026-10-30.csv"), "csv filename "+csv.filename());
    check(body.startsWith("\uFEFFEmployee Code,Employee,Department"), "csv has BOM + header");
    check(body.lines().count()==1+records.stream().filter(r->r.getDate().equals(LocalDate.of(2026,10,30))).count(), "csv row count matches");
    try { ins.exportCsv(LocalDate.of(2026,10,30), LocalDate.of(2026,10,1), null,null,null); check(false,"reversed range"); } catch (BadRequestException e) { check(true,"reversed range rejected"); }
    try { ins.exportCsv(LocalDate.of(2024,1,1), LocalDate.of(2026,1,1), null,null,null); check(false,"too long"); } catch (BadRequestException e) { check(true,"range > 366 days rejected"); }

  }
}
