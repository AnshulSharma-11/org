import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authFetch from '../../config/authFetch';
import { ADMIN_BASE } from '../../config/apiConfig';
import { BarChart, LineChart, DonutChart, ChartCard, Kpi, fmt } from '../../charts/Charts';
import { fmtDuration } from '../../userComponents/attendance/AttendancePunchCard';
import { downloadAttendanceCsv } from './exportCsv';

let RANGES = [
  { value: '7d',  label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '12m', label: 'Last 12 months' },
];

let timeOf = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

function trendLabel(label, granularity) {
  if (granularity === 'month') {
    let [y, m] = label.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString([], { month: 'short', year: '2-digit' });
  }
  return label.slice(5);                          // MM-DD
}

/** HR live attendance: who is in right now, today's numbers, trends, CSV export. */
export default function AttendanceDashboard() {
  let [date, setDate]               = useState('');      // '' = today (server decides)
  let [dept, setDept]               = useState('');
  let [departments, setDepartments] = useState([]);
  let [stats, setStats]             = useState(null);
  let [live, setLive]               = useState(null);
  let [range, setRange]             = useState('7d');
  let [trends, setTrends]           = useState(null);
  let [auto, setAuto]               = useState(true);
  let [updated, setUpdated]         = useState(null);
  let [exporting, setExporting]     = useState(false);

  // Departments for the filter
  useEffect(() => {
    authFetch(`${ADMIN_BASE}/departments?size=200`)
      .then((r) => r.json())
      .then((o) => setDepartments(o.data?.content ?? []))
      .catch(() => setDepartments([]));
  }, []);

  let loadLive = useCallback(async () => {
    try {
      let q = new URLSearchParams();
      if (date) q.set('date', date);
      if (dept) q.set('departmentId', dept);
      let [sRes, lRes] = await Promise.all([
        authFetch(`${ADMIN_BASE}/attendance/stats?${q}`),
        authFetch(`${ADMIN_BASE}/attendance/live?${q}`),
      ]);
      let [s, l] = await Promise.all([sRes.json(), lRes.json()]);
      if (!sRes.ok) throw new Error(s.message || 'Failed to load attendance stats');
      setStats(s.data);
      setLive(lRes.ok ? (l.data ?? []) : []);
      setUpdated(new Date());
    } catch (e) {
      toast.error(e.message || 'Failed to load attendance', { toastId: 'att-live-error' });
      setLive((prev) => prev ?? []);
    }
  }, [date, dept]);

  let loadTrends = useCallback(async () => {
    try {
      let q = new URLSearchParams({ range });
      if (dept) q.set('departmentId', dept);
      let res = await authFetch(`${ADMIN_BASE}/attendance/trends?${q}`);
      let obj = await res.json();
      if (!res.ok) throw new Error(obj.message || 'Failed to load trends');
      setTrends(obj.data);
    } catch (e) {
      toast.error(e.message || 'Failed to load trends', { toastId: 'att-trend-error' });
      setTrends({ points: [], granularity: 'day' });
    }
  }, [range, dept]);

  useEffect(() => { loadLive(); }, [loadLive]);
  useEffect(() => { loadTrends(); }, [loadTrends]);

  // Auto-refresh the live part every 30 s
  useEffect(() => {
    if (!auto) return undefined;
    let id = setInterval(loadLive, 30000);
    return () => clearInterval(id);
  }, [auto, loadLive]);

  async function exportCsv() {
    setExporting(true);
    try {
      let d = stats?.date || date || undefined;
      await downloadAttendanceCsv({ dateFrom: d, dateTo: d, departmentId: dept });
      toast.success('CSV downloaded');
    } catch (e) {
      toast.error(e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  let s = stats;
  let missingLabel = s?.today ? 'Not checked in' : 'Absent';
  let pts = trends?.points ?? [];
  let labels = pts.map((p) => trendLabel(p.label, trends?.granularity));

  return (
    <div className="hrms-content">
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <h4 className="mb-0"><i className="bi bi-activity"></i> Live Attendance</h4>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/admin/time-records" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-table me-1"></i>All records
          </Link>
          <button className="btn btn-outline-primary btn-sm" onClick={exportCsv} disabled={exporting}>
            {exporting
              ? <span className="spinner-border spinner-border-sm me-1"></span>
              : <i className="bi bi-download me-1"></i>}
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar mb-3">
        <input type="date" className="form-control" style={{ maxWidth: 170 }}
               value={date || s?.date || ''} onChange={(e) => setDate(e.target.value)} />
        <select className="form-select" style={{ maxWidth: 220 }} value={dept}
                onChange={(e) => setDept(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDate('')}>
          Today
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadLive}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
        <div className="form-check form-switch ms-1 mb-0 d-flex align-items-center gap-2">
          <input className="form-check-input" type="checkbox" id="att-auto" checked={auto}
                 onChange={(e) => setAuto(e.target.checked)} />
          <label className="form-check-label" htmlFor="att-auto" style={{ fontSize: 13 }}>Auto-refresh</label>
        </div>
        {updated && (
          <span className="text-muted ms-auto" style={{ fontSize: 12 }}>
            Updated {updated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {s?.weekend && (
        <div className="alert alert-secondary py-2" style={{ fontSize: 13 }}>
          <i className="bi bi-info-circle me-1"></i>
          This date is a weekend — nobody is expected, so absences are not counted.
        </div>
      )}

      {/* KPI cards */}
      {!s ? (
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="spinner-border spinner-border-sm"></span> Loading…
        </div>
      ) : (
        <>
          <div className="rp-kpis">
            <Kpi icon="bi-people"            label="Expected"          value={s.expected} tone={4} />
            <Kpi icon="bi-check-circle"      label="Present"           value={s.present}
                 sub={`${s.attendancePercent}% attendance`} tone={2} />
            <Kpi icon="bi-alarm"             label="Late check-ins"    value={s.late}
                 sub={`${s.onTime} on time`} tone={3} />
            <Kpi icon="bi-laptop"            label="Working now"       value={s.working}
                 sub={`${s.onBreak} on break`} tone={1} />
          </div>
          <div className="rp-kpis">
            <Kpi icon="bi-cup-hot"           label="On break"          value={s.onBreak} tone={3} />
            <Kpi icon="bi-umbrella"          label="On leave"          value={s.onLeave} tone={1} />
            <Kpi icon="bi-x-circle"          label={missingLabel}      value={s.absent} tone={4} />
            <Kpi icon="bi-percent"           label="Attendance rate"   value={`${s.attendancePercent}%`} tone={2} />
          </div>
        </>
      )}

      {/* Live table */}
      <div className="hrms-card mb-3">
        <div className="d-flex align-items-center justify-content-between px-3 pt-3">
          <h6 className="mb-0"><i className="bi bi-broadcast me-2"></i>Clocked in now</h6>
          <span className="text-muted" style={{ fontSize: 12 }}>
            {live ? `${live.length} ${live.length === 1 ? 'person' : 'people'}` : ''}
          </span>
        </div>
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Check in</th>
                <th>Status</th>
                <th>Worked (so far)</th>
              </tr>
            </thead>
            <tbody>
              {live === null ? (
                <tr><td colSpan={6} className="text-center py-4">
                  <span className="spinner-border spinner-border-sm me-2"></span> Loading…
                </td></tr>
              ) : live.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-4">
                  Nobody is clocked in{s?.today === false ? ' on this date' : ' right now'}.
                </td></tr>
              ) : live.map((r) => (
                <tr key={r.recordId}>
                  <td>
                    {r.name}
                    {r.employeeCode && <small className="text-muted ms-2">{r.employeeCode}</small>}
                  </td>
                  <td>{r.department || '—'}</td>
                  <td>{r.designation || '—'}</td>
                  <td>
                    {timeOf(r.checkIn)}
                    {r.late && <span className="status-badge badge-late ms-2">Late</span>}
                  </td>
                  <td>
                    <span className={`status-badge badge-${r.liveStatus.toLowerCase()}`}>
                      {r.liveStatus === 'ON_BREAK' ? 'On break' : 'Working'}
                    </span>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtDuration(r.workedSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary + trends */}
      <div className="rp-grid">
        <ChartCard title="Day summary" subtitle={s?.date} icon="bi-pie-chart" span={4}>
          {s ? (
            <DonutChart
              centerLabel="Expected"
              data={[
                { label: 'On time',     value: s.onTime,  color: 'var(--ch-5)' },
                { label: 'Late',        value: s.late,    color: 'var(--ch-3)' },
                { label: 'On leave',    value: s.onLeave, color: 'var(--ch-4)' },
                { label: missingLabel,  value: s.absent,  color: 'var(--ch-6)' },
              ]}
            />
          ) : null}
        </ChartCard>

        <ChartCard
          title="Attendance trend"
          subtitle="Person-days per period"
          icon="bi-bar-chart"
          span={8}
          right={
            <select className="form-select form-select-sm" style={{ width: 150 }} value={range}
                    onChange={(e) => setRange(e.target.value)}>
              {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          }
        >
          <BarChart
            labels={labels}
            integer
            label="Attendance trend"
            series={[
              { name: 'Present',  color: 'var(--ch-5)', values: pts.map((p) => p.present) },
              { name: 'Late',     color: 'var(--ch-3)', values: pts.map((p) => p.late) },
              { name: 'On leave', color: 'var(--ch-4)', values: pts.map((p) => p.leave) },
              { name: 'Absent',   color: 'var(--ch-6)', values: pts.map((p) => p.absent) },
            ]}
          />
        </ChartCard>

        <ChartCard title="Average working hours" subtitle="Per record, break time excluded"
                   icon="bi-hourglass-split" span={12}>
          <LineChart
            labels={labels}
            area
            format={fmt.hours}
            label="Average working hours"
            series={[{ name: 'Avg hours', color: 'var(--ch-1)', values: pts.map((p) => p.avgHours) }]}
          />
        </ChartCard>
      </div>
    </div>
  );
}
