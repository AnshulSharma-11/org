import React, { useState } from 'react';

function StatusBadge({ value }) {
  let cls = value ? `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}` : '';
  return <span className={cls}>{value}</span>;
}

export default function DisplayHelp({
  helpValue, employees, onAssign, onStatusChange, onResolve, onDelete, onFilter, FilterBar,
}) {
  let [assigningId, setAssigningId] = useState(null);
  let [assigneeId, setAssigneeId] = useState('');

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-headphones"></i> Help Desk</h4>
      </div>

      <FilterBar onFilter={onFilter} />

      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Raised By</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {helpValue.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">No help requests found.</td>
                </tr>
              ) : (
                helpValue.map((h, idx) => (
                  <tr key={h.id}>
                    <td>{idx + 1}</td>
                    <td>
                      {h.employee
                        ? `${h.employee.firstName} ${h.employee.lastName}`
                        : '—'}
                    </td>
                    <td style={{ maxWidth: 200, whiteSpace: 'normal' }}>
                      <strong>{h.subject}</strong>
                    </td>
                    <td>
                      <small className="text-muted">{h.requestType?.replace(/_/g, ' ')}</small>
                    </td>
                    <td><StatusBadge value={h.priority} /></td>
                    <td><StatusBadge value={h.status} /></td>
                    <td>
                      {assigningId === h.id ? (
                        <div className="d-flex gap-1 align-items-center">
                          <select
                            className="form-select form-select-sm"
                            style={{ maxWidth: 160 }}
                            value={assigneeId}
                            onChange={e => setAssigneeId(e.target.value)}
                          >
                            <option value="">— Select —</option>
                            {employees.map(e => (
                              <option key={e.id} value={e.id}>
                                {e.firstName} {e.lastName}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              if (assigneeId) {
                                onAssign(h, assigneeId);
                                setAssigningId(null);
                                setAssigneeId('');
                              }
                            }}
                          >
                            <i className="bi bi-check"></i>
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => { setAssigningId(null); setAssigneeId(''); }}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      ) : (
                        h.assignedTo
                          ? `${h.assignedTo.firstName} ${h.assignedTo.lastName}`
                          : <span className="text-muted">Unassigned</span>
                      )}
                    </td>
                    <td>
                      {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {/* Assign button */}
                        <button
                          className="btn btn-outline-primary btn-sm"
                          title="Assign"
                          onClick={() => { setAssigningId(h.id); setAssigneeId(''); }}
                        >
                          <i className="bi bi-person-check"></i>
                        </button>

                        {/* Status dropdown */}
                        <select
                          className="form-select form-select-sm"
                          style={{ maxWidth: 130, fontSize: '0.78rem' }}
                          value={h.status}
                          onChange={e => onStatusChange(h, e.target.value)}
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="APPROVED">Approved</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>

                        {/* Resolve button — only when IN_PROGRESS */}
                        {h.status === 'IN_PROGRESS' && (
                          <button
                            className="btn btn-success btn-sm"
                            title="Resolve"
                            onClick={() => onResolve(h)}
                          >
                            <i className="bi bi-check2-circle"></i>
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          className="btn btn-outline-danger btn-sm"
                          title="Delete"
                          onClick={() => {
                            if (window.confirm('Delete this help request?')) onDelete(h.id);
                          }}
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
    </div>
  );
}
