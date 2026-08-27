import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';
import DisplayProjects from './DisplayProjects';

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({ onFilter }) {
  let { register, handleSubmit, reset } = useForm();
  return (
    <form className="filter-bar" onSubmit={handleSubmit(onFilter)}>
      <input
        className="form-control"
        style={{ maxWidth: 220 }}
        placeholder="Search by name"
        {...register('name')}
      />
      <select className="form-select" style={{ maxWidth: 160 }} {...register('status')}>
        <option value="">All Status</option>
        <option value="PLANNED">Planned</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
        <option value="ON_HOLD">On Hold</option>
      </select>
      <select className="form-select" style={{ maxWidth: 160 }} {...register('priority')}>
        <option value="">All Priority</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>
      <button className="btn btn-primary btn-sm px-3">Apply</button>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => { reset(); onFilter({}); }}
      >
        Reset
      </button>
    </form>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[40, 200, 80, 90, 90, 70, 80].map((w, i) => (
        <td key={i}>
          <div
            className="skeleton-box"
            style={{ width: w, height: 16, borderRadius: 4,
              background: '#e2e8f0', animation: 'pulse 1.4s ease-in-out infinite' }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FetchProjects() {
  let [projects, setProjects]   = useState(null);
  let [filters, setFilters]     = useState({});
  let [isRefresh, setIsRefresh] = useState(false);
  let nav = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        let url = `${ADMIN_BASE}/projects?`;
        if (filters.name)     url += `name=${encodeURIComponent(filters.name)}&`;
        if (filters.status)   url += `status=${filters.status}&`;
        if (filters.priority) url += `priority=${filters.priority}&`;
        let res = await authFetch(url);
        let obj = await res.json();
        // Support both plain array and PageResponse envelope
        setProjects(obj.data?.content ?? obj.data ?? []);
      } catch {
        setProjects([]);
        toast.error('Failed to load projects');
      }
    }
    load();
  }, [filters, isRefresh]);

  async function deleteProject(id) {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      let res = await authFetch(`${ADMIN_BASE}/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Project deleted');
        setIsRefresh(v => !v);
      } else {
        toast.error('Failed to delete project');
      }
    } catch {
      toast.error('Failed to delete project');
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (projects === null) {
    return (
      <div className="hrms-content">
        <div className="page-header">
          <h4><i className="bi bi-kanban"></i> Projects</h4>
          <button className="btn btn-primary btn-sm" disabled>
            <i className="bi bi-plus-lg me-1"></i> Add Project
          </button>
        </div>
        <div className="hrms-card">
          <div className="table-responsive">
            <table className="table hrms-table mb-0">
              <thead>
                <tr>
                  <th>#</th><th>Project Name</th><th>Priority</th>
                  <th>Status</th><th>Deadline</th><th>Team</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map(n => <SkeletonRow key={n} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DisplayProjects
      projects={projects}
      onDelete={deleteProject}
      onRefresh={() => setIsRefresh(v => !v)}
      onFilter={setFilters}
      FilterBar={FilterBar}
      onAdd={() => nav('/admin/projects/add')}
    />
  );
}
