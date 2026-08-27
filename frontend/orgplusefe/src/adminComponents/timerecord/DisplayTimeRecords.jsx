import React from 'react';

function StatusBadge({ value }) {
  let cls = value ? `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}` : '';
  return <span className={cls}>{value}</span>;
}

export default function DisplayTimeRecords({ recordsValue, onDelete, onFilter, FilterBar }) {
  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-clock"></i> Attendance Records</h4>
      </div>
      <FilterBar onFilter={onFilter} />
      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours Worked</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recordsValue.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-muted py-4">No records found.</td></tr>
              ) : (
                recordsValue.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{idx + 1}</td>
                    <td>{r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—'}</td>
                    <td>{r.date || '—'}</td>
                    <td>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '—'}</td>
                    <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—'}</td>
                    <td>{r.hoursWorked != null ? `${r.hoursWorked}h` : '—'}</td>
                    <td><StatusBadge value={r.status} /></td>
                    <td>{r.remarks || '—'}</td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => { if (window.confirm('Delete this record?')) onDelete(r.id); }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
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
