import authFetch from '../../config/authFetch';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function AddBranch() {
  let { register, handleSubmit, formState: { errors } } = useForm();
  let nav = useNavigate();

  async function onSubmit(data) {
    try {
      let res = await authFetch(`${ADMIN_BASE}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) { toast.success('Branch added!'); nav('/admin/branches', { replace: true }); }
      else toast.error('Failed to add branch');
    } catch {
      toast.error('Failed to add branch');
    }
  }

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-diagram-3"></i> Add Branch</h4>
      </div>
      <div className="hrms-form-card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          <div className="mb-3">
            <label className="form-label">Branch Name</label>
            <input
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. Mumbai HQ"
              {...register('name', { required: 'Branch name is required' })}
            />
            <div style={{ minHeight: 20 }}>
              {errors.name && <div className="invalid-feedback d-block">{errors.name.message}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">City</label>
            <input
              className={`form-control ${errors.city ? 'is-invalid' : ''}`}
              placeholder="e.g. Mumbai"
              {...register('city', { required: 'City is required' })}
            />
            <div style={{ minHeight: 20 }}>
              {errors.city && <div className="invalid-feedback d-block">{errors.city.message}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Country</label>
            <input
              className={`form-control ${errors.country ? 'is-invalid' : ''}`}
              placeholder="e.g. India"
              {...register('country', { required: 'Country is required' })}
            />
            <div style={{ minHeight: 20 }}>
              {errors.country && <div className="invalid-feedback d-block">{errors.country.message}</div>}
            </div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary px-4">Add Branch</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => nav('/admin/branches')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
