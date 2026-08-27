import React from 'react';
import { Link } from 'react-router-dom';

function StatusBadge({ value }) {
  let cls = value ? `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}` : '';
  return <span className={cls}>{value}</span>;
}

export default function DisplayDepartments({ departmentsValue, onDelete, onFilter, FilterBar }) {
  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-building"></i> Departments</h4>
        <Link to="/admin/departments/add" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1"></i> Add Department
        </Link>
      </div>

      <FilterBar onFilter={onFilter} />

      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
                <th>Manager</th>
                <th>Parent Dept</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departmentsValue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">No departments found.</td>
                </tr>
              ) : (
                departmentsValue.map((d, idx) => (
                  <tr key={d.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.description || '—'}</td>
                    <td>{d.manager ? `${d.manager.firstName} ${d.manager.lastName}` : '—'}</td>
                    <td>{d.parentDepartment ? d.parentDepartment.name : '—'}</td>
                    <td>
                      <StatusBadge value={d.isActive ? 'Active' : 'Inactive'} />
                    </td>
                    <td>
                      <Link
                        to={`/admin/departments/update/${d.id}`}
                        className="btn btn-outline-primary btn-sm me-2"
                      >
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          if (window.confirm(`Delete department "${d.name}"?`)) onDelete(d.id);
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
