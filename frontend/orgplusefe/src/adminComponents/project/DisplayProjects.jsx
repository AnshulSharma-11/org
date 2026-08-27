import React, { useState } from 'react';
import AssignEmployeesModal from './AssignEmployeesModal';

function StatusBadge({ value }) {
  let cls = value
    ? `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}`
    : '';
  return <span className={cls}>{value?.replace('_', ' ')}</span>;
}

export default function DisplayProjects({ projects, onDelete, onRefresh, onAdd, FilterBar, onFilter }) {
  let [assignTarget, setAssignTarget] = useState(null); // project being assigned

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-kanban"></i> Projects</h4>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>
          <i className="bi bi-plus-lg me-1"></i> Add Project
        </button>
      </div>

      <FilterBar onFilter={onFilter} />

      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Project Name</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Team</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map((p, idx) => (
                  <tr key={p.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="fw-500">{p.name}</div>
                      {p.description && (
                        <div
                          style={{ fontSize: 12, color: '#64748b', maxWidth: 260,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={p.description}
                        >
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td><StatusBadge value={p.priority} /></td>
                    <td><StatusBadge value={p.status} /></td>
                    <td>{p.deadline ?? '—'}</td>
                    <td>
                      <span
                        className="status-badge badge-in_progress"
                        title={(p.employees ?? []).map(e => `${e.firstName} ${e.lastName}`).join(', ')}
                      >
                        {(p.employees ?? []).length} member{(p.employees ?? []).length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          title="Assign Employees"
                          onClick={() => setAssignTarget(p)}
                        >
                          <i className="bi bi-person-plus"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete Project"
                          onClick={() => onDelete(p.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Employees Modal — rendered inline, only when a project is targeted */}
      {assignTarget && (
        <AssignEmployeesModal
          project={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSaved={() => { setAssignTarget(null); onRefresh(); }}
        />
      )}
    </div>
  );
}
