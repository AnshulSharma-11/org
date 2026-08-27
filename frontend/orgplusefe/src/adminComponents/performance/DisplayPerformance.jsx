import React from 'react';
import { Link } from 'react-router-dom';

function StatusBadge({ value }) {
  let cls = value ? `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}` : '';
  return <span className={cls}>{value}</span>;
}

function StarRating({ rating }) {
  if (rating == null) return <span className="text-muted">—</span>;
  let full = Math.floor(rating);
  let half = rating - full >= 0.5;
  let empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
      <small className="text-muted ms-1">({rating})</small>
    </span>
  );
}

export default function DisplayPerformance({ reviewsValue, onDelete, onFilter, FilterBar }) {
  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-graph-up-arrow"></i> Performance Reviews</h4>
        <Link to="/admin/performance/add" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1"></i> Add Review
        </Link>
      </div>
      <FilterBar onFilter={onFilter} />
      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Cycle Name</th>
                <th>Employee</th>
                <th>Reviewer</th>
                <th>Start</th>
                <th>End</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviewsValue.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-muted py-4">No performance reviews found.</td></tr>
              ) : (
                reviewsValue.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{r.cycleName}</strong></td>
                    <td>{r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—'}</td>
                    <td>{r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}` : '—'}</td>
                    <td>{r.startDate || '—'}</td>
                    <td>{r.endDate || '—'}</td>
                    <td><StarRating rating={r.overallRating} /></td>
                    <td><StatusBadge value={r.status} /></td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => { if (window.confirm('Delete this review?')) onDelete(r.id); }}
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
