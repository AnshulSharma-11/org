import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EMPLOYEE_BASE } from '../../config/apiConfig';

function StatCard({ label, value, icon, bg, color, loading }) {
  return (
    <div className="hrms-stat-card" style={{ background: bg }}>
      <div className="stat-icon" style={{ color }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="stat-body">
        <div className="stat-value" style={{ color }}>
          {loading
            ? <span className="skeleton-box" style={{ width: 40, height: 28, borderRadius: 4, display: 'inline-block', background: '#e2e8f0' }} />
            : value}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function Badge({ value }) {
  if (!value) return '—';
  const cls = `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}`;
  return <span className={cls}>{value.replace('_', ' ')}</span>;
}

function SkeletonRow() {
  return (
    <tr>
      {[120, 70, 90, 90, 200].map((w, i) => (
        <td key={i}>
          <div style={{ width: w, height: 14, borderRadius: 4, background: '#e2e8f0', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </td>
      ))}
    </tr>
  );
}

export default function MyProjects() {
  const { employeeId }          = useParams();
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    authFetch(`${EMPLOYEE_BASE(employeeId)}/projects`)
      .then(r => r.json())
      .then(obj => setProjects(Array.isArray(obj.data) ? obj.data : []))
      .catch(() => setProjects([]));
  }, [employeeId]);

  const loading    = projects === null;
  const total      = loading ? 0 : projects.length;
  const inProgress = loading ? 0 : projects.filter(p => p.status === 'IN_PROGRESS').length;
  const completed  = loading ? 0 : projects.filter(p => p.status === 'COMPLETED').length;

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-kanban"></i> My Projects</h4>
      </div>

      <div className="hrms-stats-row" style={{ marginBottom: 24 }}>
        <StatCard label="Total Assigned" value={total}      icon="bi-kanban"          bg="#eff6ff" color="#1d4ed8" loading={loading} />
        <StatCard label="In Progress"    value={inProgress} icon="bi-arrow-clockwise" bg="#fff7ed" color="#c2410c" loading={loading} />
        <StatCard label="Completed"      value={completed}  icon="bi-check-circle"    bg="#f0fdf4" color="#15803d" loading={loading} />
      </div>

      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(n => <SkeletonRow key={n} />)
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-5">
                    <i className="bi bi-kanban" style={{ fontSize: 32, opacity: 0.3, display: 'block', marginBottom: 8 }}></i>
                    No projects have been assigned to you yet.
                  </td>
                </tr>
              ) : (
                projects.map(p => (
                  <tr key={p.id}>
                    <td className="fw-500">{p.name}</td>
                    <td><Badge value={p.priority} /></td>
                    <td><Badge value={p.status} /></td>
                    <td>{p.deadline ?? '—'}</td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>
                      {p.description
                        ? p.description.length > 80 ? p.description.slice(0, 80) + '…' : p.description
                        : '—'}
                    </td>
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
