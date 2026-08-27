import React from 'react';
import { Link } from 'react-router-dom';

export default function DisplayDesignations({ designationsValue, onDelete, onFilter, FilterBar }) {
  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-award"></i> Designations</h4>
        <Link to="/admin/designations/add" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1"></i> Add Designation
        </Link>
      </div>

      <FilterBar onFilter={onFilter} />

      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {designationsValue.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">No designations found.</td>
                </tr>
              ) : (
                designationsValue.map((d, idx) => (
                  <tr key={d.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{d.title}</strong></td>
                    <td>
                      <span className="badge bg-light text-dark border">Level {d.level}</span>
                    </td>
                    <td>
                      <Link
                        to={`/admin/designations/update/${d.id}`}
                        className="btn btn-outline-primary btn-sm me-2"
                      >
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          if (window.confirm(`Delete designation "${d.title}"?`)) onDelete(d.id);
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
