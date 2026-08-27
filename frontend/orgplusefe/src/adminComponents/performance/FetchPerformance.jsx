import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';
import DisplayPerformance from './DisplayPerformance';

function FilterBar({ onFilter }) {
  let { register, handleSubmit, reset } = useForm();
  return (
    <form className="filter-bar" onSubmit={handleSubmit(onFilter)}>
      <input className="form-control" style={{ maxWidth: 160 }} placeholder="Employee ID" {...register('employeeId')} />
      <input className="form-control" style={{ maxWidth: 160 }} placeholder="Reviewer ID" {...register('reviewerId')} />
      <input className="form-control" style={{ maxWidth: 180 }} placeholder="Cycle Name" {...register('cycleName')} />
      <select className="form-select" style={{ maxWidth: 160 }} {...register('status')}>
        <option value="">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
      </select>
      <input type="date" className="form-control" style={{ maxWidth: 160 }} {...register('startDate')} />
      <input type="date" className="form-control" style={{ maxWidth: 160 }} {...register('endDate')} />
      <select className="form-select" style={{ maxWidth: 150 }} {...register('sortBy')}>
        <option value="">Sort By</option>
        <option value="startDate">Start Date</option>
        <option value="overallRating">Rating</option>
        <option value="cycleName">Cycle Name</option>
      </select>
      <select className="form-select" style={{ maxWidth: 130 }} {...register('sortDirection')}>
        <option value="desc">Newest First</option>
        <option value="asc">Oldest First</option>
      </select>
      <button className="btn btn-primary btn-sm px-3">Apply</button>
      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { reset(); onFilter({}); }}>Reset</button>
    </form>
  );
}

export default function FetchPerformance() {
  let [reviews, setReviews] = useState(null);
  let [isDeleted, setIsDeleted] = useState(false);
  let [filters, setFilters] = useState({});

  useEffect(() => {
    async function load() {
      try {
        let url = `${ADMIN_BASE}/performance/filter?`;
        if (filters.employeeId)    url += `employeeId=${filters.employeeId}&`;
        if (filters.reviewerId)    url += `reviewerId=${filters.reviewerId}&`;
        if (filters.cycleName)     url += `cycleName=${encodeURIComponent(filters.cycleName)}&`;
        if (filters.status)        url += `status=${filters.status}&`;
        if (filters.startDate)     url += `startDate=${filters.startDate}&`;
        if (filters.endDate)       url += `endDate=${filters.endDate}&`;
        if (filters.sortBy)        url += `sortBy=${filters.sortBy}&`;
        if (filters.sortDirection) url += `sortDirection=${filters.sortDirection}&`;
        let res = await authFetch(url);
        let obj = await res.json();
        setReviews(obj.data?.content ?? []);
      } catch {
        setReviews([]);
        toast.error('Failed to load performance reviews');
      }
    }
    load();
  }, [isDeleted, filters]);

  async function deleteReview(id) {
    setIsDeleted(false);
    try {
      let res = await authFetch(`${ADMIN_BASE}/performance/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Review deleted'); setIsDeleted(true); }
      else toast.error('Could not delete review');
    } catch { toast.error('Could not delete review'); }
  }

  if (reviews === null) return <div className="hrms-content"><div className="d-flex align-items-center gap-2"><span className="spinner-border spinner-border-sm"></span> Loading...</div></div>;

  return <DisplayPerformance reviewsValue={reviews} onDelete={deleteReview} onFilter={setFilters} FilterBar={FilterBar} />;
}
