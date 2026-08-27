import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';
import DisplayDepartments from './DisplayDepartments';

function FilterBar({ onFilter }) {
  let { register, handleSubmit, reset } = useForm();
  return (
    <form className="filter-bar" onSubmit={handleSubmit(onFilter)}>
      <input
        className="form-control"
        style={{ maxWidth: 200 }}
        placeholder="Search..."
        {...register('search')}
      />
      <select className="form-select" style={{ maxWidth: 150 }} {...register('isActive')}>
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
      <select className="form-select" style={{ maxWidth: 150 }} {...register('sortBy')}>
        <option value="">Sort By</option>
        <option value="name">Name</option>
      </select>
      <select className="form-select" style={{ maxWidth: 130 }} {...register('sortDirection')}>
        <option value="asc">A → Z</option>
        <option value="desc">Z → A</option>
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

export default function FetchDepartments() {
  let [departments, setDepartments] = useState(null);
  let [isDeleted, setIsDeleted] = useState(false);
  let [filters, setFilters] = useState({});

  useEffect(() => {
    async function load() {
      try {
        let url;
        if (filters.isActive !== undefined && filters.isActive !== '') {
          url = `${ADMIN_BASE}/departments/filter?`;
          url += `isActive=${filters.isActive}&`;
          if (filters.sortBy)        url += `sortBy=${filters.sortBy}&`;
          if (filters.sortDirection) url += `sortDirection=${filters.sortDirection}&`;
        } else {
          url = `${ADMIN_BASE}/departments?`;
          if (filters.search)        url += `search=${encodeURIComponent(filters.search)}&`;
          if (filters.sortBy)        url += `sortBy=${filters.sortBy}&`;
          if (filters.sortDirection) url += `sortDirection=${filters.sortDirection}&`;
        }
        let res = await authFetch(url);
        let obj = await res.json();
        setDepartments(obj.data?.content ?? []);
      } catch {
        setDepartments([]);
        toast.error('Failed to load departments');
      }
    }
    load();
  }, [isDeleted, filters]);

  async function deleteDepartment(id) {
    setIsDeleted(false);
    try {
      let res = await authFetch(`${ADMIN_BASE}/departments/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Department deleted'); setIsDeleted(true); }
      else toast.error('Could not delete department');
    } catch {
      toast.error('Could not delete department');
    }
  }

  if (departments === null) return <div className="hrms-content"><div className="d-flex align-items-center gap-2"><span className="spinner-border spinner-border-sm"></span> Loading...</div></div>;

  return (
    <DisplayDepartments
      departmentsValue={departments}
      onDelete={deleteDepartment}
      onFilter={setFilters}
      FilterBar={FilterBar}
    />
  );
}
