-- Attendance live tracking (self check-in / breaks / late flag)
-- Hibernate `ddl-auto=update` adds these columns automatically on startup.
-- Run this manually only if your environment uses ddl-auto=validate/none.
ALTER TABLE time_records
  ADD COLUMN live_status      VARCHAR(255) NULL,
  ADD COLUMN is_late          BIT          NULL,
  ADD COLUMN break_started_at DATETIME(6)  NULL,
  ADD COLUMN break_seconds    BIGINT       NULL;

-- Optional: speeds up the live dashboard and the one-record-per-day lookups
CREATE INDEX idx_time_records_emp_date ON time_records (employee_id, date);
CREATE INDEX idx_time_records_date     ON time_records (date);
