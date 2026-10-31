# OrgPluse — HR Management System

OrgPluse is a full-stack HRMS: HR admins manage the organisation, and employees use a
self-service portal for attendance, leave, payroll, documents and more.

- **Backend:** Spring Boot 4 (Java 25), Spring Security + JWT, JPA/Hibernate, MySQL
- **Frontend:** React 19 (Create React App), React Router 7, Bootstrap 5, React Hook Form

## Features

| Area | Admin (HR) | Employee |
|---|---|---|
| **Attendance** | Live dashboard, trends, records, CSV export, manual marking | Check in / break / check out, month calendar, history |
| **Leave** | Review and approve / reject requests | Apply for leave, track balance and status |
| **Payroll** | Payroll runs per active employee (Razorpay integration) | View own payroll |
| **People** | Employees, branches, departments, designations | Profile and documents |
| **Performance** | Performance reviews | — |
| **Projects** | Project management | View projects |
| **Help desk** | Handle help requests | Raise help requests |
| **Reports** | HR analytics with charts | Personal reports |
| **Assistant** | — | In-app chatbot (`frontend/orgplusefe/src/chatbot`) |

The app supports light and dark themes.

## Project structure

```
org/
├── backend/orgplusede/            Spring Boot application
│   ├── src/main/java/com/orgpluse/
│   │   ├── attendance/            Attendance module (services, controllers, DTOs, calculator)
│   │   ├── auth/                  Admin + employee registration and login
│   │   ├── configuration/         Security, CORS, JWT filter wiring
│   │   ├── controllers/           REST controllers
│   │   ├── services/  repositories/  specifications/  entities/  dto/
│   │   └── exception/             Typed exceptions + GlobalExceptionHandler
│   ├── src/test/java/             Unit tests
│   └── Dockerfile
├── frontend/orgplusefe/           React application
│   └── src/
│       ├── adminComponents/       Admin pages (attendance, leave, payroll, ...)
│       ├── userComponents/        Employee pages
│       ├── charts/  reports/      Charting + report pages
│       ├── chatbot/               Assistant
│       └── config/                apiConfig.js, appConfig.js, authFetch.js
├── migrations/                    Manual SQL migrations (optional, see Database)
├── ATTENDANCE_FEATURES.md         Attendance module details
└── orgplues.sql                   Scratch SQL helpers
```

## Prerequisites

- JDK **25** and Maven 3.9+ (or Docker)
- Node.js 18+ and npm
- MySQL 8+

## Getting started

### 1. Database

```sql
CREATE DATABASE orgpluse;
```

Tables are created and updated automatically on startup (`spring.jpa.hibernate.ddl-auto=update`).

### 2. Backend

Set the environment variables below, then:

```bash
cd backend/orgplusede
mvn spring-boot:run
```

The API listens on `http://localhost:8080` (override with `PORT`).

| Variable | Required | Purpose |
|---|---|---|
| `DB_URL` | yes | JDBC URL, e.g. `jdbc:mysql://localhost:3306/orgpluse` |
| `DB_USERNAME` | yes | Database user |
| `DB_PASSWORD` | yes | Database password |
| `JWT_SECRET` | yes | Secret used to sign tokens — use a long random string (32+ characters) |
| `RAZORPAY_KEY_ID` | yes | Razorpay key id (payroll payments) |
| `RAZORPAY_KEY_SECRET` | yes | Razorpay key secret |
| `PORT` | no | Server port (default `8080`) |
| `ATTENDANCE_ZONE` | no | Time zone for check-in times (default `Asia/Kolkata`) |
| `ATTENDANCE_SHIFT_START` | no | Shift start, `HH:mm` (default `10:00`) |
| `ATTENDANCE_GRACE_MINUTES` | no | Grace period before a check-in counts as late (default `0`) |
| `ATTENDANCE_WEEKEND_DAYS` | no | Comma-separated days (default `SATURDAY,SUNDAY`) |

Never commit real secrets; keep them in your environment or a secrets manager.

### 3. Frontend

```bash
cd frontend/orgplusefe
npm install --legacy-peer-deps
npm start
```

The app runs on `http://localhost:3000` and talks to `http://localhost:8080` by default.
Optional `.env` values:

| Variable | Purpose | Default |
|---|---|---|
| `REACT_APP_API_URL` | Backend base URL | `http://localhost:8080` |
| `REACT_APP_LEAVE_QUOTA` | Annual leave quota (days) | `20` |

> **Note:** the committed `package-lock.json` is out of sync with `package.json`, so `npm ci`
> fails. Use `npm install` (with `--legacy-peer-deps` if npm reports a peer-dependency
> conflict) and commit the refreshed lockfile.

### 4. First login

Create the first admin, then sign in from the app:

```bash
curl -X POST http://localhost:8080/api/v1/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"HR Admin","email":"admin@example.com","password":"ChangeMe123!"}'
```

Employees register through `POST /api/v1/auth/employee/register`
(required: `employeeCode`, `firstName`, `lastName`, `email`, `password`, `phone`, `status`).
Only employees with status `ACTIVE` can log in, check in, or be counted in attendance figures.

### Docker (backend)

```bash
cd backend/orgplusede
docker build -t orgpluse-backend .
docker run -p 8080:8080 \
  -e DB_URL=... -e DB_USERNAME=... -e DB_PASSWORD=... \
  -e JWT_SECRET=... -e RAZORPAY_KEY_ID=... -e RAZORPAY_KEY_SECRET=... \
  orgpluse-backend
```

## Attendance

Employees record their own day; HR sees it live. Full details, including behaviour
notes, are in [ATTENDANCE_FEATURES.md](ATTENDANCE_FEATURES.md).

**Employee** — `/api/v1/employee/{employeeId}/attendance`

| Method | Path | Action |
|---|---|---|
| GET | `/today` | Current state and which buttons are allowed |
| POST | `/check-in` | Clock in (late flag is automatic; blocked on approved leave) |
| POST | `/start-break` | Start a break |
| POST | `/resume-work` | End the break |
| POST | `/check-out` | Clock out — hours = (out − in) − breaks |

**Admin** — `/api/v1/admin/attendance`

| Method | Path | Action |
|---|---|---|
| GET | `/stats` | Expected, present, on time, late, working, on break, on leave, absent, attendance % |
| GET | `/live` | Employees clocked in right now |
| GET | `/trends?range=7d\|30d\|12m` | Present / late / leave / absent and average hours |
| GET | `/export` | CSV download (up to 366 days) |

HR can also create and edit records manually via `/api/v1/admin/time-records`.

Statuses: `PRESENT`, `ABSENT`, `HALF_DAY`, `ON_LEAVE`, `WEEKEND`. Lateness is a separate flag,
and live state (`WORKING` / `ON_BREAK`) is tracked while an employee is clocked in.

## Security model

- **Roles:** `ROLE_ADMIN` for `/api/v1/admin/**`, `ROLE_EMPLOYEE` for `/api/v1/employee/**`.
- **Auth:** stateless JWT in the `Authorization: Bearer <token>` header.
- **Own-data checks:** the attendance endpoints verify that `{employeeId}` in the URL belongs to
  the logged-in employee. The other self-service endpoints (leave, payroll, documents, help,
  profile) also take the id from the URL; apply `SelfAccessGuard` (in the `attendance`
  package) to them for the same protection.
- **CORS:** allowed origins are listed in `configuration/SecurityConfig.java` — add your
  deployed frontend URL there.

## Database

Entities map to tables such as `employees`, `time_records`, `leaves`, `departments`,
`designations` and `branches`. The attendance module adds four nullable columns to
`time_records` (`live_status`, `is_late`, `break_started_at`, `break_seconds`).
`ddl-auto=update` creates them automatically; if you run with `validate` or `none`, apply
`migrations/2026_attendance_live_tracking.sql` manually.

## Testing

```bash
# Backend — attendance unit tests (no database needed)
cd backend/orgplusede
mvn test -Dtest='Attendance*Test'

# Backend — everything. Note: HRMSApplicationTests boots the full Spring context,
# so DB_URL / DB_USERNAME / DB_PASSWORD / JWT_SECRET / RAZORPAY_* must be set.
mvn test

# Frontend
cd frontend/orgplusefe
CI=true npm test -- --watchAll=false
```

## Build for production

```bash
# Backend jar
cd backend/orgplusede && mvn clean package -DskipTests

# Frontend static files (output in frontend/orgplusefe/build)
cd frontend/orgplusefe && npm run build
```

## Repository hygiene

The `.gitignore` files now exclude `target/`, `uploads/`, `build/` and `.env` files. Files
that were committed before this change stay tracked until you remove them from the index:

```bash
git rm -r --cached backend/orgplusede/uploads frontend/orgplusefe/build
git commit -m "Stop tracking build output and uploaded files"
```

The `uploads/` folder contained a real uploaded document; consider purging it from history
if it holds personal data.

## Known limitations

- Attendance "absent" is derived (active employees with no present record and no leave); no
  scheduled job writes absent rows.
- A session left open overnight is closed automatically the next time that employee checks in.
