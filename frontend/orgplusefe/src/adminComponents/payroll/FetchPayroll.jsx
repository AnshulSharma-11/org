import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';
import DisplayPayroll from './DisplayPayroll';

function FilterBar({ onFilter }) {
  let { register, handleSubmit, reset } = useForm();
  return (
    <form className="filter-bar" onSubmit={handleSubmit(onFilter)}>
      <input className="form-control" style={{ maxWidth: 160 }} placeholder="Employee ID" type="number" {...register('employeeId')} />
      <select className="form-select" style={{ maxWidth: 130 }} {...register('month')}>
        <option value="">All Months</option>
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {new Date(0, i).toLocaleString('default', { month: 'long' })}
          </option>
        ))}
      </select>
      <input className="form-control" type="number" style={{ maxWidth: 100 }} placeholder="Year" {...register('year')} />
      <select className="form-select" style={{ maxWidth: 150 }} {...register('status')}>
        <option value="">All Status</option>
        <option value="DRAFT">Draft</option>
        <option value="PROCESSED">Processed</option>
        <option value="APPROVED">Approved</option>
        <option value="PAID">Paid</option>
      </select>
      <select className="form-select" style={{ maxWidth: 150 }} {...register('sortBy')}>
        <option value="">Sort By</option>
        <option value="runDate">Run Date</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
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

export default function FetchPayroll() {
  let [payrolls, setPayrolls] = useState(null);
  let [isDeleted, setIsDeleted] = useState(false);
  let [filters, setFilters] = useState({});

  useEffect(() => {
    async function load() {
      try {
        let url = `${ADMIN_BASE}/payroll/filter?`;
        if (filters.employeeId)    url += `employeeId=${filters.employeeId}&`;
        if (filters.month)         url += `month=${filters.month}&`;
        if (filters.year)          url += `year=${filters.year}&`;
        if (filters.status)        url += `status=${filters.status}&`;
        if (filters.sortBy)        url += `sortBy=${filters.sortBy}&`;
        if (filters.sortDirection) url += `sortDirection=${filters.sortDirection}&`;
        let res = await authFetch(url);
        let obj = await res.json();
        setPayrolls(obj.data ?? []);
      } catch {
        setPayrolls([]);
        toast.error('Failed to load payroll');
      }
    }
    load();
  }, [isDeleted, filters]);

  async function deletePayroll(id) {
    setIsDeleted(false);
    try {
      let res = await authFetch(`${ADMIN_BASE}/payroll/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Payroll run deleted'); setIsDeleted(true); }
      else toast.error('Could not delete payroll run');
    } catch { toast.error('Could not delete payroll run'); }
  }

  if (payrolls === null) return <div className="hrms-content"><div className="d-flex align-items-center gap-2"><span className="spinner-border spinner-border-sm"></span> Loading...</div></div>;

  return <DisplayPayroll payrollsValue={payrolls} onDelete={deletePayroll} onFilter={setFilters} FilterBar={FilterBar} />;
}
