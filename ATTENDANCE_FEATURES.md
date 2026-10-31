# Attendance features (ported from greathire-teamora)

## Employee (ROLE_EMPLOYEE) — `/api/v1/employee/{employeeId}/attendance`
| Method | Path | What it does |
|---|---|---|
| GET  | `/today`        | Current state + which buttons are allowed |
| POST | `/check-in`     | Clock in (late flag set automatically; blocked on approved leave) |
| POST | `/start-break`  | Start a break |
| POST | `/resume-work`  | End the break |
| POST | `/check-out`    | Clock out; hours = (out − in) − breaks |

Every call verifies `{employeeId}` belongs to the logged-in employee (`SelfAccessGuard`).
The existing `GET /api/v1/employee/{employeeId}/attendance` now has the same check.

## HR (ROLE_ADMIN) — `/api/v1/admin/attendance`
| Method | Path | What it does |
|---|---|---|
| GET | `/stats?date=&departmentId=`  | Expected, present, on-time, late, working, on break, on leave, absent, attendance % |
| GET | `/live?date=&departmentId=`   | Employees clocked in right now (working / on break) |
| GET | `/trends?range=7d\|30d\|12m&departmentId=` | Present / late / leave / absent + average hours per day or month |
| GET | `/export?dateFrom=&dateTo=&status=&departmentId=&employeeId=` | CSV download (max 366 days; formula-injection safe) |

## Configuration (`application.properties`, all optional)
```
attendance.zone=Asia/Kolkata
attendance.shift-start=10:00     # check-ins after this are late
attendance.grace-minutes=0
attendance.weekend-days=SATURDAY,SUNDAY
```
Env overrides: `ATTENDANCE_ZONE`, `ATTENDANCE_SHIFT_START`, `ATTENDANCE_GRACE_MINUTES`, `ATTENDANCE_WEEKEND_DAYS`.

## Database
Four nullable columns are added to `time_records` (`live_status`, `is_late`,
`break_started_at`, `break_seconds`). `ddl-auto=update` creates them on startup;
`migrations/2026_attendance_live_tracking.sql` is there if you run with `validate`/`none`.

## Frontend
- Employee dashboard + My Attendance: punch card (live timer), month calendar with legend, Late/On-leave stats.
- Admin → **Live Attendance** (`/admin/attendance`): KPI cards, live table (30 s auto-refresh), day summary donut, trend charts, CSV export.
- Admin → Attendance Records: Export CSV, Late / Working badges, Break column.

## Behaviour notes
- Checking in again after checking out the same day counts the gap as break time.
- A session left open on a previous day is auto-closed (remark added) the next time the employee checks in.
- HR edits via *Mark Attendance* clear any live session and recompute the late flag.
- "Absent" is derived: active employees with no present record and no leave. Today it is shown as "Not checked in".
- Fixed: the Mark Attendance dropdown saved leave as `LEAVE`; it now saves `ON_LEAVE` (legacy `LEAVE` rows are still recognised).
