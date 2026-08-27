import authFetch from '../../config/authFetch';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function UpdateDesignation() {
  let { id } = useParams();
  let { register, handleSubmit, formState: { errors }, reset } = useForm();
  let nav = useNavigate();

  useEffect(() => {
    authFetch(`${ADMIN_BASE}/designations/${id}`)
      .then(r => r.json())
      .then(obj => reset(obj.data))
      .catch(() => toast.error('Failed to load designation'));
  }, [id, reset]);

  async function onSubmit(data) {
    try {
      let payload = { ...data, level: parseInt(data.level, 10) };
      let res = await authFetch(`${ADMIN_BASE}/designations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { toast.success('Designation updated!'); nav('/admin/designations', { replace: true }); }
      else toast.error('Failed to update designation');
    } catch {
      toast.error('Failed to update designation');
    }
  }

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-award"></i> Update Designation</h4>
      </div>
      <div className="hrms-form-card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          <div className="mb-3">
            <label className="form-label">Title</label>
            <input
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
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
            <button className="btn btn-primary px-4">Update Designation</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => nav('/admin/designations')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
