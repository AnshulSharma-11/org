import React from 'react';
import { Link } from 'react-router-dom';

function StatusBadge({ value }) {
  let cls = value ? `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}` : '';
  return <span className={cls}>{value}</span>;
}

export default function DisplayEmployees({ employeesValue, onDelete, onFilter, FilterBar }) {
  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-people"></i> Employees</h4>
        <Link to="/admin/employees/add" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1"></i> Add Employee
        </Link>
      </div>

      <FilterBar onFilter={onFilter} />

      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Hire Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeesValue.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center text-muted py-4">No employees found.</td>
                </tr>
              ) : (
                employeesValue.map((e, idx) => (
                  <tr key={e.id}>
                    <td>{idx + 1}</td>
                    <td><code>{e.employeeCode}</code></td>
                    <td><strong>{e.firstName} {e.lastName}</strong></td>
                    <td>{e.email}</td>
                    <td>{e.phone || '—'}</td>
                    <td>{e.department?.name || '—'}</td>
                    <td>{e.designation?.title || '—'}</td>
                    <td>{e.branch?.name || '—'}</td>
                    <td><StatusBadge value={e.status} /></td>
                    <td>{e.hireDate || '—'}</td>
                    <td>
                      <Link
                        to={`/admin/employees/update/${e.id}`}
                        className="btn btn-outline-primary btn-sm me-2"
                      >
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          if (window.confirm(`Delete employee "${e.firstName} ${e.lastName}"?`)) onDelete(e.id);
                        }}
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
