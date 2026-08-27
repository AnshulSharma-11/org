import React from 'react';
import { Link } from 'react-router-dom';

export default function DisplayBranches({ branchesValue, onDelete, onFilter, FilterBar }) {
  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-diagram-3"></i> Branches</h4>
        <Link to="/admin/branches/add" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1"></i> Add Branch
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
                <th>City</th>
                <th>Country</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branchesValue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">No branches found.</td>
                </tr>
              ) : (
                branchesValue.map((b, idx) => (
                  <tr key={b.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{b.name}</strong></td>
                    <td>{b.city}</td>
                    <td>{b.country}</td>
                    <td>
                      <Link
                        to={`/admin/branches/update/${b.id}`}
                        className="btn btn-outline-primary btn-sm me-2"
                      >
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          if (window.confirm(`Delete branch "${b.name}"?`)) onDelete(b.id);
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
