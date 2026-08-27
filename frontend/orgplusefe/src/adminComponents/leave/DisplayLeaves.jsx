import React from 'react';

function StatusBadge({ value }) {
  let cls = value ? `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}` : '';
  return <span className={cls}>{value}</span>;
}

export default function DisplayLeaves({ leavesValue, onApprove, onReject, onDelete, onFilter, FilterBar }) {
  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-umbrella"></i> Leave Requests</h4>
      </div>
      <FilterBar onFilter={onFilter} />
      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Approved By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leavesValue.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-muted py-4">No leave requests found.</td></tr>
              ) : (
                leavesValue.map((l, idx) => (
                  <tr key={l.id}>
                    <td>{idx + 1}</td>
                    <td>{l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : '—'}</td>
                    <td>{l.leaveType}</td>
                    <td>{l.startDate}</td>
                    <td>{l.endDate}</td>
                    <td>{l.totalDays}</td>
                    <td><StatusBadge value={l.status} /></td>
                    <td style={{ maxWidth: 160, whiteSpace: 'normal' }}>{l.reason || '—'}</td>
                    <td>{l.approvedBy ? `${l.approvedBy.firstName} ${l.approvedBy.lastName}` : '—'}</td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {l.status === 'PENDING' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => onApprove(l)}
                              title="Approve"
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => onReject(l)}
                              title="Reject"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => { if (window.confirm('Delete this leave?')) onDelete(l.id); }}
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
