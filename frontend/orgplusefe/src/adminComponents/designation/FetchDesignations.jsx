import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';
import DisplayDesignations from './DisplayDesignations';

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
      <input
        className="form-control"
        style={{ maxWidth: 120 }}
        type="number"
        placeholder="Level"
        {...register('level')}
      />
      <select className="form-select" style={{ maxWidth: 150 }} {...register('sortBy')}>
        <option value="">Sort By</option>
        <option value="title">Title</option>
        <option value="level">Level</option>
      </select>
      <select className="form-select" style={{ maxWidth: 130 }} {...register('sortDirection')}>
        <option value="asc">A → Z / Low → High</option>
        <option value="desc">Z → A / High → Low</option>
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

export default function FetchDesignations() {
  let [designations, setDesignations] = useState(null);
  let [isDeleted, setIsDeleted] = useState(false);
  let [filters, setFilters] = useState({});

  useEffect(() => {
    async function load() {
      try {
        let url;
        if (filters.level || (filters.sortBy && !filters.search)) {
          url = `${ADMIN_BASE}/designations/filter?`;
          if (filters.level)         url += `level=${filters.level}&`;
          if (filters.sortBy)        url += `sortBy=${filters.sortBy}&`;
          if (filters.sortDirection) url += `sortDirection=${filters.sortDirection}&`;
        } else {
          url = `${ADMIN_BASE}/designations?`;
          if (filters.search)        url += `search=${encodeURIComponent(filters.search)}&`;
          if (filters.sortBy)        url += `sortBy=${filters.sortBy}&`;
          if (filters.sortDirection) url += `sortDirection=${filters.sortDirection}&`;
        }
        let res = await authFetch(url);
        let obj = await res.json();
        setDesignations(obj.data?.content ?? []);
      } catch {
        setDesignations([]);
        toast.error('Failed to load designations');
      }
    }
    load();
  }, [isDeleted, filters]);

  async function deleteDesignation(id) {
    setIsDeleted(false);
    try {
      let res = await authFetch(`${ADMIN_BASE}/designations/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Designation deleted'); setIsDeleted(true); }
      else toast.error('Could not delete designation');
    } catch {
      toast.error('Could not delete designation');
    }
  }

  if (designations === null) return <div className="hrms-content"><div className="d-flex align-items-center gap-2"><span className="spinner-border spinner-border-sm"></span> Loading...</div></div>;

  return (
    <DisplayDesignations
      designationsValue={designations}
      onDelete={deleteDesignation}
      onFilter={setFilters}
      FilterBar={FilterBar}
    />
  );
}
