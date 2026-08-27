import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function AddDepartment() {
  let { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { isActive: true } });
  let nav = useNavigate();
  let [employees, setEmployees] = useState([]);
  let [departments, setDepartments] = useState([]);

  useEffect(() => {
    Promise.all([
      authFetch(`${ADMIN_BASE}/employees?size=200`).then(r => r.json()),
      authFetch(`${ADMIN_BASE}/departments?size=200`).then(r => r.json()),
    ]).then(([empRes, deptRes]) => {
      setEmployees(empRes.data?.content ?? []);
      setDepartments(deptRes.data?.content ?? []);
    }).catch(() => toast.error('Failed to load dropdown data'));
  }, []);

  async function onSubmit(data) {
    try {
      let payload = {
        name: data.name,
        description: data.description,
        isActive: data.isActive === true || data.isActive === 'true',
        ...(data.managerId && { manager: { id: parseInt(data.managerId, 10) } }),
        ...(data.parentDepartmentId && { parentDepartment: { id: parseInt(data.parentDepartmentId, 10) } }),
      };
      let res = await authFetch(`${ADMIN_BASE}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { toast.success('Department added!'); nav('/admin/departments', { replace: true }); }
      else toast.error('Failed to add department');
    } catch {
      toast.error('Failed to add department');
    }
  }

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-building"></i> Add Department</h4>
      </div>
      <div className="hrms-form-card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          <div className="mb-3">
            <label className="form-label">Department Name</label>
            <input
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. Engineering"
              {...register('name', { required: 'Department name is required' })}
            />
            <div style={{ minHeight: 20 }}>
              {errors.name && <div className="invalid-feedback d-block">{errors.name.message}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Optional description..."
              {...register('description')}
            />
            <div style={{ minHeight: 20 }}></div>
          </div>

          <div className="mb-3">
            <label className="form-label">Manager</label>
            <select className="form-select" {...register('managerId')}>
              <option value="">— No Manager —</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            <div style={{ minHeight: 20 }}></div>
          </div>

          <div className="mb-3">
            <label className="form-label">Parent Department</label>
            <select className="form-select" {...register('parentDepartmentId')}>
              <option value="">— No Parent —</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <div style={{ minHeight: 20 }}></div>
          </div>

          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="isActive"
              {...register('isActive')}
              defaultChecked
            />
            <label className="form-check-label" htmlFor="isActive">Active</label>
            <div style={{ minHeight: 20 }}></div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary px-4">Add Department</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => nav('/admin/departments')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
