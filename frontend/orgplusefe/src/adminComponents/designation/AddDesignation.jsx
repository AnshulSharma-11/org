import authFetch from '../../config/authFetch';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function AddDesignation() {
  let { register, handleSubmit, formState: { errors } } = useForm();
  let nav = useNavigate();

  async function onSubmit(data) {
    try {
      let payload = { ...data, level: parseInt(data.level, 10) };
      let res = await authFetch(`${ADMIN_BASE}/designations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { toast.success('Designation added!'); nav('/admin/designations', { replace: true }); }
      else toast.error('Failed to add designation');
    } catch {
      toast.error('Failed to add designation');
    }
  }

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-award"></i> Add Designation</h4>
      </div>
      <div className="hrms-form-card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          <div className="mb-3">
            <label className="form-label">Title</label>
            <input
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              placeholder="e.g. Senior Developer"
              {...register('title', { required: 'Title is required' })}
            />
            <div style={{ minHeight: 20 }}>
              {errors.title && <div className="invalid-feedback d-block">{errors.title.message}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Level</label>
            <input
              type="number"
              className={`form-control ${errors.level ? 'is-invalid' : ''}`}
              placeholder="e.g. 3"
              {...register('level', {
                required: 'Level is required',
                min: { value: 1, message: 'Level must be at least 1' },
              })}
            />
            <div style={{ minHeight: 20 }}>
              {errors.level && <div className="invalid-feedback d-block">{errors.level.message}</div>}
            </div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary px-4">Add Designation</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => nav('/admin/designations')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
