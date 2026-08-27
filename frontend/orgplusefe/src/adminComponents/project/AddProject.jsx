import authFetch from '../../config/authFetch';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function AddProject() {
  let { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { status: 'PLANNED', priority: 'MEDIUM' },
  });
  let nav = useNavigate();

  async function onSubmit(data) {
    try {
      let payload = {
        name:        data.name.trim(),
        description: data.description?.trim() || null,
        deadline:    data.deadline || null,
        status:      data.status,
        priority:    data.priority,
      };
      let res = await authFetch(`${ADMIN_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Project created!');
        nav('/admin/projects', { replace: true });
      } else {
        let b = await res.json();
        toast.error(b.message || 'Failed to create project');
      }
    } catch {
      toast.error('Failed to create project');
    }
  }

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-kanban"></i> Add Project</h4>
      </div>
      <div className="hrms-form-card" style={{ maxWidth: 720 }}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="row g-3">

            {/* Project Name */}
            <div className="col-12">
              <label className="form-label">Project Name <span className="text-danger">*</span></label>
              <input
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                placeholder="Enter project name"
                {...register('name', { required: 'Project name is required' })}
              />
              <div style={{ minHeight: 20 }}>
                {errors.name && <div className="invalid-feedback d-block">{errors.name.message}</div>}
              </div>
            </div>

            {/* Status */}
            <div className="col-md-6">
              <label className="form-label">Status <span className="text-danger">*</span></label>
              <select
                className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                {...register('status', { required: 'Status is required' })}
              >
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
              <div style={{ minHeight: 20 }}>
                {errors.status && <div className="invalid-feedback d-block">{errors.status.message}</div>}
              </div>
            </div>

            {/* Priority */}
            <div className="col-md-6">
              <label className="form-label">Priority <span className="text-danger">*</span></label>
              <select
                className={`form-select ${errors.priority ? 'is-invalid' : ''}`}
                {...register('priority', { required: 'Priority is required' })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <div style={{ minHeight: 20 }}>
                {errors.priority && <div className="invalid-feedback d-block">{errors.priority.message}</div>}
              </div>
            </div>

            {/* Deadline */}
            <div className="col-md-6">
              <label className="form-label">Deadline</label>
              <input
                type="date"
                className="form-control"
                {...register('deadline')}
              />
              <div style={{ minHeight: 20 }}></div>
            </div>

            {/* Description */}
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Project description (optional)"
                {...register('description')}
              />
              <div style={{ minHeight: 20 }}></div>
            </div>

          </div>

          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary px-4" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving…</> : 'Create Project'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => nav('/admin/projects')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
