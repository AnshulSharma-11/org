import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { EMPLOYEE_BASE } from '../../config/apiConfig';
import { DEFAULT_LEAVE_QUOTA } from '../../config/appConfig';

function StatusBadge({ value }) {
  let cls = value ? `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}` : '';
  return <span className={cls}>{value}</span>;
}

export default function MyLeaves() {
  let { employeeId } = useParams();
  let [leaves, setLeaves] = useState(null);

  useEffect(() => {
    authFetch(`${EMPLOYEE_BASE(employeeId)}/leaves`)
      .then(r => r.json())
      .then(obj => setLeaves(obj.data?.content ?? []))
      .catch(() => { setLeaves([]); toast.error('Failed to load leaves'); });
  }, [employeeId]);

  if (leaves === null) return (
    <div className="d-flex align-items-center gap-2 mt-4">
      <span className="spinner-border spinner-border-sm"></span> Loading...
    </div>
  );

  let approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
  let remaining = DEFAULT_LEAVE_QUOTA - approvedCount;

  return (
    <div>
      <div className="page-header">
        <h4><i className="bi bi-umbrella"></i> My Leaves</h4>
        <Link to={`/employee/${employeeId}/leaves/apply`} className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1"></i> Apply Leave
        </Link>
      </div>

      {/* Remaining counter */}
      <div className="hrms-card mb-3 d-inline-flex align-items-center gap-3" style={{ padding: '14px 22px' }}>
        <div
          className="stat-icon"
          style={{ background: '#fefce8', color: '#a16207', width: 44, height: 44, borderRadius: 10, fontSize: '1.2rem' }}
        >
          <i className="bi bi-calendar-minus"></i>
        </div>
        <div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{remaining}</div>
          <div className="stat-label">Leaves Remaining (out of {DEFAULT_LEAVE_QUOTA})</div>
        </div>
      </div>

      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Total Days</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Rejection Note</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">No leave requests found.</td>
                </tr>
              ) : (
                leaves.map((l, idx) => (
                  <tr key={l.id}>
                    <td>{idx + 1}</td>
                    <td>{l.leaveType}</td>
                    <td>{l.startDate}</td>
                    <td>{l.endDate}</td>
                    <td>{l.totalDays}</td>
                    <td><StatusBadge value={l.status} /></td>
                    <td style={{ maxWidth: 180, whiteSpace: 'normal' }}>{l.reason || '—'}</td>
                    <td style={{ maxWidth: 180, whiteSpace: 'normal' }}>{l.rejectionNote || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
