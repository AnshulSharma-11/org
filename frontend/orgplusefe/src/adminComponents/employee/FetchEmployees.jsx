import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';
import DisplayEmployees from './DisplayEmployees';

function FilterBar({ onFilter, departments, designations, branches }) {
  let { register, handleSubmit, reset } = useForm();
  return (
    <form className="filter-bar" onSubmit={handleSubmit(onFilter)}>
      <input
        className="form-control"
        style={{ maxWidth: 180 }}
        placeholder="Search name/email..."
        {...register('search')}
      />
      <select className="form-select" style={{ maxWidth: 150 }} {...register('status')}>
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="TERMINATED">Terminated</option>
      </select>
      <select className="form-select" style={{ maxWidth: 160 }} {...register('departmentId')}>
        <option value="">All Departments</option>
        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <select className="form-select" style={{ maxWidth: 160 }} {...register('designationId')}>
        <option value="">All Designations</option>
        {designations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
      </select>
      <select className="form-select" style={{ maxWidth: 150 }} {...register('branchId')}>
        <option value="">All Branches</option>
        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <select className="form-select" style={{ maxWidth: 130 }} {...register('gender')}>
        <option value="">All Genders</option>
        <option value="MALE">Male</option>
        <option value="FEMALE">Female</option>
        <option value="OTHER">Other</option>
      </select>
      <select className="form-select" style={{ maxWidth: 150 }} {...register('sortBy')}>
        <option value="">Sort By</option>
        <option value="firstName">Name</option>
        <option value="hireDate">Hire Date</option>
        <option value="employeeCode">Code</option>
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

export default function FetchEmployees() {
  let [employees, setEmployees] = useState(null);
  let [isDeleted, setIsDeleted] = useState(false);
  let [filters, setFilters] = useState({});
  let [departments, setDepartments] = useState([]);
  let [designations, setDesignations] = useState([]);
  let [branches, setBranches] = useState([]);

  useEffect(() => {
    Promise.all([
      authFetch(`${ADMIN_BASE}/departments?size=200`).then(r => r.json()),
      authFetch(`${ADMIN_BASE}/designations?size=200`).then(r => r.json()),
      authFetch(`${ADMIN_BASE}/branches?size=200`).then(r => r.json()),
    ]).then(([dRes, desRes, bRes]) => {
      setDepartments(dRes.data?.content ?? []);
      setDesignations(desRes.data?.content ?? []);
      setBranches(bRes.data?.content ?? []);
    });
  }, []);

  useEffect(() => {
    async function load() {
      try {
        let url = `${ADMIN_BASE}/employees/filter?`;
        if (filters.search)        url += `search=${encodeURIComponent(filters.search)}&`;
        if (filters.status)        url += `status=${filters.status}&`;
        if (filters.departmentId)  url += `departmentId=${filters.departmentId}&`;
        if (filters.designationId) url += `designationId=${filters.designationId}&`;
        if (filters.branchId)      url += `branchId=${filters.branchId}&`;
        if (filters.gender)        url += `gender=${filters.gender}&`;
        if (filters.sortBy)        url += `sortBy=${filters.sortBy}&`;
        if (filters.sortDirection) url += `sortDirection=${filters.sortDirection}&`;
        let res = await authFetch(url);
        let obj = await res.json();
        setEmployees(obj.data?.content ?? []);
      } catch {
        setEmployees([]);
        toast.error('Failed to load employees');
      }
    }
    load();
  }, [isDeleted, filters]);

  async function deleteEmployee(id) {
    setIsDeleted(false);
    try {
      let res = await authFetch(`${ADMIN_BASE}/employees/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Employee deleted'); setIsDeleted(true); }
      else toast.error('Could not delete employee');
    } catch {
      toast.error('Could not delete employee');
    }
  }

  if (employees === null) return <div className="hrms-content"><div className="d-flex align-items-center gap-2"><span className="spinner-border spinner-border-sm"></span> Loading...</div></div>;

  return (
    <DisplayEmployees
      employeesValue={employees}
      onDelete={deleteEmployee}
      onFilter={setFilters}
      FilterBar={(props) => (
        <FilterBar
          {...props}
          departments={departments}
          designations={designations}
          branches={branches}
        />
      )}
    />
  );
}
