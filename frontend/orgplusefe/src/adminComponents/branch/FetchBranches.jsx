import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';
import DisplayBranches from './DisplayBranches';

function FilterBar({ onFilter }) {
  let { register, handleSubmit, reset } = useForm();
  return (
    <form className="filter-bar" onSubmit={handleSubmit(onFilter)}>
      <input className="form-control" style={{ maxWidth:200 }} placeholder="Search..." {...register('search')} />
      <input className="form-control" style={{ maxWidth:150 }} placeholder="City" {...register('city')} />
      <input className="form-control" style={{ maxWidth:150 }} placeholder="Country" {...register('country')} />
      <select className="form-select" style={{ maxWidth:150 }} {...register('sortBy')}>
        <option value="">Sort By</option>
        <option value="name">Name</option>
        <option value="city">City</option>
        <option value="country">Country</option>
      </select>
      <select className="form-select" style={{ maxWidth:130 }} {...register('sortDirection')}>
        <option value="asc">A → Z</option>
        <option value="desc">Z → A</option>
      </select>
      <button className="btn btn-primary btn-sm px-3">Apply</button>
      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { reset(); onFilter({}); }}>Reset</button>
    </form>
  );
}

export default function FetchBranches() {
  let [branches, setBranches] = useState(null);
  let [isDeleted, setIsDeleted] = useState(false);
  let [filters, setFilters] = useState({});

  useEffect(() => {
    async function load() {
      try {
        let url = `${ADMIN_BASE}/branches/filter?`;
        if (filters.search)        url += `search=${encodeURIComponent(filters.search)}&`;
        if (filters.city)          url += `city=${encodeURIComponent(filters.city)}&`;
        if (filters.country)       url += `country=${encodeURIComponent(filters.country)}&`;
        if (filters.sortBy)        url += `sortBy=${filters.sortBy}&`;
        if (filters.sortDirection) url += `sortDirection=${filters.sortDirection}&`;

        let res = await authFetch(url);
        let obj = await res.json();
        setBranches(obj.data?.content ?? obj.data ?? []);
      } catch {
        setBranches([]);
        toast.error('Failed to load branches');
      }
    }
    load();
  }, [isDeleted, filters]);

  async function deleteBranch(id) {
    setIsDeleted(false);
    try {
      let res = await authFetch(`${ADMIN_BASE}/branches/${id}`, { method:'DELETE' });
      if (res.ok) { toast.success('Branch deleted'); setIsDeleted(true); }
      else toast.error('Could not delete branch');
    } catch { toast.error('Could not delete branch'); }
  }

  if (branches === null) return (
    <div className="hrms-content">
      <div className="d-flex align-items-center gap-2"><span className="spinner-border spinner-border-sm"></span> Loading...</div>
    </div>
  );

  return <DisplayBranches branchesValue={branches} onDelete={deleteBranch} onFilter={setFilters} FilterBar={FilterBar} />;
}
