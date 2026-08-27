import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function AddPerformanceReview() {
  let { register, handleSubmit, formState: { errors } } = useForm();
  let nav = useNavigate();
  let [employees, setEmployees] = useState([]);

  useEffect(() => {
    authFetch(`${ADMIN_BASE}/employees?size=200`)
      .then(r => r.json())
      .then(obj => setEmployees(obj.data?.content ?? []))
      .catch(() => toast.error('Failed to load employees'));
  }, []);

  async function onSubmit(data) {
    try {
      let payload = {
        cycleName: data.cycleName,
        startDate: data.startDate,
        endDate: data.endDate,
        criteriaRatings: data.criteriaRatings,
        overallRating: parseFloat(data.overallRating),
        status: data.status,
        submittedAt: data.submittedAt || null,
        employee: data.employeeId ? { id: parseInt(data.employeeId, 10) } : undefined,
        reviewer: data.reviewerId ? { id: parseInt(data.reviewerId, 10) } : undefined,
      };
      let res = await authFetch(`${ADMIN_BASE}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { toast.success('Performance review added!'); nav('/admin/performance', { replace: true }); }
      else toast.error('Failed to add performance review');
    } catch {
      toast.error('Failed to add performance review');
    }
  }

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-graph-up-arrow"></i> Add Performance Review</h4>
      </div>
      <div className="hrms-form-card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          <div className="mb-3">
            <label className="form-label">Cycle Name</label>
            <input className={`form-control ${errors.cycleName ? 'is-invalid' : ''}`}
              placeholder="e.g. Q1 2025"
              {...register('cycleName', { required: 'Cycle name is required' })} />
            <div style={{ minHeight: 20 }}>
              {errors.cycleName && <div className="invalid-feedback d-block">{errors.cycleName.message}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Employee</label>
            <select className={`form-select ${errors.employeeId ? 'is-invalid' : ''}`}
              {...register('employeeId', { required: 'Employee is required' })}>
              <option value="">— Select Employee —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
            <div style={{ minHeight: 20 }}>
              {errors.employeeId && <div className="invalid-feedback d-block">{errors.employeeId.message}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Reviewer</label>
            <select className={`form-select ${errors.reviewerId ? 'is-invalid' : ''}`}
              {...register('reviewerId', { required: 'Reviewer is required' })}>
              <option value="">— Select Reviewer —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
            <div style={{ minHeight: 20 }}>
              {errors.reviewerId && <div className="invalid-feedback d-block">{errors.reviewerId.message}</div>}
            </div>
          </div>

          <div className="row g-3 mb-1">
            <div className="col-md-6">
              <label className="form-label">Start Date</label>
              <input type="date" className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                {...register('startDate', { required: 'Start date is required' })} />
              <div style={{ minHeight: 20 }}>
                {errors.startDate && <div className="invalid-feedback d-block">{errors.startDate.message}</div>}
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">End Date</label>
              <input type="date" className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                {...register('endDate', { required: 'End date is required' })} />
              <div style={{ minHeight: 20 }}>
                {errors.endDate && <div className="invalid-feedback d-block">{errors.endDate.message}</div>}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Overall Rating <small className="text-muted">(0 – 5)</small></label>
            <input type="number" step="0.1" min="0" max="5"
              className={`form-control ${errors.overallRating ? 'is-invalid' : ''}`}
              placeholder="e.g. 4.2"
              {...register('overallRating', {
                required: 'Rating is required',
                min: { value: 0, message: 'Min 0' },
                max: { value: 5, message: 'Max 5' },
              })} />
            <div style={{ minHeight: 20 }}>
              {errors.overallRating && <div className="invalid-feedback d-block">{errors.overallRating.message}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Status</label>
            <select className={`form-select ${errors.status ? 'is-invalid' : ''}`}
              {...register('status', { required: 'Status is required' })}>
              <option value="">— Select Status —</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <div style={{ minHeight: 20 }}>
              {errors.status && <div className="invalid-feedback d-block">{errors.status.message}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Submitted At</label>
            <input type="datetime-local" className="form-control" {...register('submittedAt')} />
            <div style={{ minHeight: 20 }}></div>
          </div>

          <div className="mb-3">
            <label className="form-label">Criteria Ratings <small className="text-muted">(JSON)</small></label>
            <textarea className="form-control" rows={4}
              placeholder='{"communication": 4, "technical": 5, "teamwork": 3}'
              {...register('criteriaRatings')} />
            <div style={{ minHeight: 20 }}></div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary px-4">Add Review</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => nav('/admin/performance')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
