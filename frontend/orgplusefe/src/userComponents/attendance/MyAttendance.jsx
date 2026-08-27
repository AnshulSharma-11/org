import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { EMPLOYEE_BASE } from '../../config/apiConfig';

function StatusBadge({ value }) {
  let cls = value
    ? `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}`
    : '';
  return <span className={cls}>{value}</span>;
}

function StatCard({ label, value, icon, bg, color, loading }) {
  return (
    <div className="hrms-stat-card" style={{ background: bg }}>
      <div className="stat-icon" style={{ color }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="stat-body">
        <div className="stat-value" style={{ color }}>
          {loading
            ? <span style={{ display: 'inline-block', width: 40, height: 28, borderRadius: 4, background: '#e2e8f0' }} />
            : value}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function MyAttendance() {
  let { employeeId }          = useParams();
  let [records, setRecords]   = useState(null);
  let [filters, setFilters]   = useState({});

  let { register, handleSubmit, reset } = useForm({
    defaultValues: {
      month: new Date().getMonth() + 1,
      year:  new Date().getFullYear(),
    },
  });

  useEffect(() => {
    async function load() {
      try {
        let url = `${EMPLOYEE_BASE(employeeId)}/attendance?`;
        if (filters.month && filters.year) {
          let m       = String(filters.month).padStart(2, '0');
          let y       = filters.year;
          let lastDay = new Date(y, filters.month, 0).getDate();
          url += `dateFrom=${y}-${m}-01&dateTo=${y}-${m}-${String(lastDay).padStart(2, '0')}&`;
        }
        let res = await authFetch(url);
        let obj = await res.json();
        setRecords(obj.data?.content ?? []);
      } catch {
        setRecords([]);
        toast.error('Failed to load attendance');
      }
    }
    load();
  }, [employeeId, filters]);

  // ── Stats computed from fetched records (no extra API call) ───────────────
  let loading      = records === null;
  let presentCount = loading ? 0 : records.filter(r => r.status === 'PRESENT').length;
  let absentCount  = loading ? 0 : records.filter(r => r.status === 'ABSENT').length;
  let halfDayCount = loading ? 0 : records.filter(r => r.status === 'HALF_DAY').length;
  let totalHours   = loading ? '0.0'
    : records.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0).toFixed(1);

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-clock"></i> My Attendance</h4>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="hrms-stats-row" style={{ marginBottom: 20 }}>
        <StatCard
          label="Days Present" value={presentCount} icon="bi-check-circle-fill"
          bg="#f0fdf4" color="#15803d" loading={loading}
        />
        <StatCard
          label="Days Absent"  value={absentCount}  icon="bi-x-circle-fill"
          bg="#fef2f2" color="#b91c1c" loading={loading}
        />
        <StatCard
          label="Half Days"    value={halfDayCount} icon="bi-circle-half"
          bg="#fefce8" color="#a16207" loading={loading}
        />
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <form
        className="filter-bar mb-3"
        onSubmit={handleSubmit(data => setFilters(data))}
      >
        <select className="form-select" style={{ maxWidth: 150 }} {...register('month')}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="form-control"
          style={{ maxWidth: 100 }}
          placeholder="Year"
          {...register('year')}
        />
        <button className="btn btn-primary btn-sm px-3">Apply</button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => {
            reset({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
            setFilters({});
          }}
        >
          Reset
        </button>
      </form>

      {/* ── Records table ─────────────────────────────────────────────────── */}
      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    <span className="spinner-border spinner-border-sm me-2"></span> Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5">
                    <i className="bi bi-calendar-x"
                       style={{ fontSize: 32, opacity: 0.3, display: 'block', marginBottom: 8 }}>
                    </i>
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{idx + 1}</td>
                    <td>{r.date || '—'}</td>
                    <td>{r.checkIn  ? new Date(r.checkIn).toLocaleTimeString()  : '—'}</td>
                    <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—'}</td>
                    <td>{r.hoursWorked != null ? `${r.hoursWorked}h` : '—'}</td>
                    <td><StatusBadge value={r.status} /></td>
                    <td>{r.remarks || r.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && records.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 600 }}>
                  <td colSpan={4} className="text-end pe-3">Summary:</td>
                  <td>{totalHours}h</td>
                  <td>
                    <span className="status-badge badge-present">{presentCount} Present</span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
