import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EMPLOYEE_BASE } from '../../config/apiConfig';
import { DEFAULT_LEAVE_QUOTA } from '../../config/appConfig';

export default function EmployeeDashboard() {
  let { employeeId } = useParams();
  let [emp, setEmp] = useState(null);
  let [leaves, setLeaves] = useState([]);
  let [attendance, setAttendance] = useState([]);
  let [help, setHelp] = useState([]);
  let [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        let [empRes, leavesRes, attRes, helpRes] = await Promise.all([
          authFetch(`${EMPLOYEE_BASE(employeeId)}/profile`),
          authFetch(`${EMPLOYEE_BASE(employeeId)}/leaves`),
          authFetch(`${EMPLOYEE_BASE(employeeId)}/attendance`),
          authFetch(`${EMPLOYEE_BASE(employeeId)}/help`),
        ]);
        let [empData, leavesData, attData, helpData] = await Promise.all([
          empRes.json(), leavesRes.json(), attRes.json(), helpRes.json(),
        ]);
        setEmp(empData.data);
        setLeaves(leavesData.data?.content ?? []);
        setAttendance(attData.data?.content ?? []);
        setHelp(helpData.data?.content ?? []);
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [employeeId]);

  if (loading) return (
    <div className="d-flex align-items-center gap-2 mt-4">
      <span className="spinner-border spinner-border-sm"></span> Loading...
    </div>
  );

  let now = new Date();
  let thisMonth = now.getMonth();
  let thisYear = now.getFullYear();

  let approvedLeaves = leaves.filter(l => l.status === 'APPROVED').length;
  let leavesRemaining = DEFAULT_LEAVE_QUOTA - approvedLeaves;
  let daysPresent = attendance.filter(a => {
    let d = new Date(a.date);
    return a.status === 'PRESENT' && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;
  let openTickets = help.filter(h => h.status === 'OPEN').length;
  let pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;

  let initials = emp
    ? `${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  let base = `/employee/${employeeId}`;

  let stats = [
    {
      label: 'Leaves Remaining',
      value: leavesRemaining,
      icon: 'bi-calendar-minus',
      bg: '#fefce8',
      color: '#a16207',
    },
    {
      label: 'Days Present',
      value: daysPresent,
      icon: 'bi-clock-history',
      bg: '#f0fdf4',
      color: '#15803d',
    },
    {
      label: 'Open Tickets',
      value: openTickets,
      icon: 'bi-headphones',
      bg: '#dbeafe',
      color: '#1e40af',
    },
    {
      label: 'Pending Leaves',
      value: pendingLeaves,
      icon: 'bi-hourglass-split',
      bg: '#fff7ed',
      color: '#c2410c',
    },
  ];

  let quickActions = [
    { label: 'My Profile',    to: `${base}/profile`,      cls: 'qc-blue',   icon: 'bi-person-badge' },
    { label: 'My Documents',  to: `${base}/documents`,    cls: 'qc-purple', icon: 'bi-folder2-open' },
    { label: 'Apply Leave',   to: `${base}/leaves/apply`, cls: 'qc-teal',   icon: 'bi-calendar-plus' },
    { label: 'Raise Help',    to: `${base}/help/raise`,   cls: 'qc-indigo', icon: 'bi-headset' },
    { label: 'View Payslip',  to: `${base}/payroll`,      cls: 'qc-green',  icon: 'bi-wallet2' },
    { label: 'My Attendance', to: `${base}/attendance`,   cls: 'qc-orange', icon: 'bi-clock' },
  ];

  return (
    <div>
      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar">{initials}</div>
        <div>
          <div className="profile-name">
            {emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${employeeId}`}
            {emp?.employeeCode && (
              <span className="badge bg-white bg-opacity-25 ms-2" style={{ fontSize: '0.75rem' }}>
                {emp.employeeCode}
              </span>
            )}
          </div>
          <div className="profile-meta">
            {emp?.designation?.title && (
              <span><i className="bi bi-award"></i> {emp.designation.title}</span>
            )}
            {emp?.department?.name && (
              <span><i className="bi bi-building"></i> {emp.department.name}</span>
            )}
            {emp?.branch?.name && (
              <span><i className="bi bi-diagram-3"></i> {emp.branch.name}</span>
            )}
            {emp?.hireDate && (
              <span><i className="bi bi-calendar3"></i> Joined {emp.hireDate}</span>
            )}
            {emp?.manager && (
              <span>
                <i className="bi bi-person-badge"></i>
                Manager: {emp.manager.firstName} {emp.manager.lastName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        {stats.map((s, i) => (
          <div className="col-sm-6 col-xl-3" key={i}>
            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: s.bg, color: s.color }}
              >
                <i className={`bi ${s.icon}`}></i>
              </div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section-title">
        <i className="bi bi-lightning-charge"></i> Quick Actions
      </div>
      <div className="row g-3">
        {quickActions.map((qa, i) => (
          <div className="col-sm-6 col-md-3" key={i}>
            <Link to={qa.to} className={`quick-card ${qa.cls}`} style={{ minHeight: 90 }}>
              <i className={`bi ${qa.icon}`}></i>
              <span>{qa.label}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
