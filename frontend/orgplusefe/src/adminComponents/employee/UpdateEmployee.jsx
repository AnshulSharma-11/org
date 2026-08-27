import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function UpdateEmployee() {
  let { id } = useParams();
  let { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  let nav = useNavigate();
  let [departments, setDepartments] = useState([]);
  let [designations, setDesignations] = useState([]);
  let [branches, setBranches] = useState([]);
  let [managers, setManagers] = useState([]);

  let selectedDeptId = watch('department.id');

  useEffect(() => {
    Promise.all([
      authFetch(`${ADMIN_BASE}/employees/${id}`).then(r => r.json()),
      authFetch(`${ADMIN_BASE}/departments?size=200`).then(r => r.json()),
      authFetch(`${ADMIN_BASE}/designations?size=200`).then(r => r.json()),
      authFetch(`${ADMIN_BASE}/branches?size=200`).then(r => r.json()),
    ]).then(([empRes, dRes, desRes, bRes]) => {
      setDepartments(dRes.data?.content ?? []);
      setDesignations(desRes.data?.content ?? []);
      setBranches(bRes.data?.content ?? []);
      let e = empRes.data;
      reset({
        employeeCode: e.employeeCode,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        passwordHash: '',
        phone: e.phone,
        dob: e.dob,
        gender: e.gender,
        address: e.address,
        hireDate: e.hireDate,
        terminationDate: e.terminationDate,
        status: e.status,
        'department.id': e.department?.id ?? '',
        'designation.id': e.designation?.id ?? '',
        'branch.id': e.branch?.id ?? '',
        'manager.id': e.manager?.id ?? '',
      });
      if (e.department?.id) {
        authFetch(`${ADMIN_BASE}/employees/filter?departmentId=${e.department.id}&size=200`)
          .then(r => r.json())
          .then(obj => setManagers(obj.data?.content ?? []));
      }
    }).catch(() => toast.error('Failed to load employee data'));
  }, [id, reset]);

  useEffect(() => {
    if (!selectedDeptId) { setManagers([]); return; }
    authFetch(`${ADMIN_BASE}/employees/filter?departmentId=${selectedDeptId}&size=200`)
      .then(r => r.json())
      .then(obj => setManagers(obj.data?.content ?? []))
      .catch(() => setManagers([]));
  }, [selectedDeptId]);

  async function onSubmit(data) {
    try {
      let payload = {
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dob: data.dob,
        gender: data.gender,
        address: data.address,
        hireDate: data.hireDate,
        terminationDate: data.terminationDate || null,
        status: data.status,
        department: data.department?.id ? { id: parseInt(data.department?.id, 10) } : undefined,
        designation: data.designation?.id ? { id: parseInt(data.designation?.id, 10) } : undefined,
        branch: data.branch?.id ? { id: parseInt(data.branch?.id, 10) } : undefined,
        manager: data.manager?.id ? { id: parseInt(data.manager?.id, 10) } : undefined,
      };
      if (data.passwordHash && data.passwordHash.trim() !== '') {
        payload.passwordHash = data.passwordHash;
      }
      let res = await authFetch(`${ADMIN_BASE}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { toast.success('Employee updated!'); nav('/admin/employees', { replace: true }); }
      else toast.error('Failed to update employee');
    } catch {
      toast.error('Failed to update employee');
    }
  }

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-person-gear"></i> Update Employee</h4>
      </div>
      <div className="hrms-form-card" style={{ maxWidth: 720 }}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="row g-3">

            <div className="col-md-6">
              <label className="form-label">Employee Code</label>
              <input className={`form-control ${errors.employeeCode ? 'is-invalid' : ''}`}
                {...register('employeeCode', { required: 'Employee code is required' })} />
              <div style={{ minHeight: 20 }}>
                {errors.employeeCode && <div className="invalid-feedback d-block">{errors.employeeCode.message}</div>}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">First Name</label>
              <input className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                {...register('firstName', { required: 'First name is required' })} />
              <div style={{ minHeight: 20 }}>
                {errors.firstName && <div className="invalid-feedback d-block">{errors.firstName.message}</div>}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Last Name</label>
              <input className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                {...register('lastName', { required: 'Last name is required' })} />
              <div style={{ minHeight: 20 }}>
                {errors.lastName && <div className="invalid-feedback d-block">{errors.lastName.message}</div>}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                {...register('email', { required: 'Email is required' })} />
              <div style={{ minHeight: 20 }}>
                {errors.email && <div className="invalid-feedback d-block">{errors.email.message}</div>}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Password</label>
              <input type="password" className="form-control"
                placeholder="Leave blank to keep current"
                {...register('passwordHash')} />
              <div style={{ minHeight: 20 }}></div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input className="form-control" {...register('phone')} />
              <div style={{ minHeight: 20 }}></div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-control" {...register('dob')} />
              <div style={{ minHeight: 20 }}></div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Gender</label>
              <select className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
                {...register('gender', { required: 'Gender is required' })}>
                <option value="">— Select Gender —</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <div style={{ minHeight: 20 }}>
                {errors.gender && <div className="invalid-feedback d-block">{errors.gender.message}</div>}
              </div>
            </div>

            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea className="form-control" rows={2} {...register('address')} />
              <div style={{ minHeight: 20 }}></div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Hire Date</label>
              <input type="date" className={`form-control ${errors.hireDate ? 'is-invalid' : ''}`}
                {...register('hireDate', { required: 'Hire date is required' })} />
              <div style={{ minHeight: 20 }}>
                {errors.hireDate && <div className="invalid-feedback d-block">{errors.hireDate.message}</div>}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Termination Date</label>
              <input type="date" className="form-control" {...register('terminationDate')} />
              <div style={{ minHeight: 20 }}></div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                {...register('status', { required: 'Status is required' })}>
                <option value="">— Select Status —</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
              </select>
              <div style={{ minHeight: 20 }}>
                {errors.status && <div className="invalid-feedback d-block">{errors.status.message}</div>}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Department</label>
              <select className="form-select" {...register('department.id')}>
                <option value="">— Select Department —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div style={{ minHeight: 20 }}></div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Manager</label>
              <select className="form-select" {...register('manager.id')}>
                <option value="">— Select Manager —</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
              <div style={{ minHeight: 20 }}></div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Designation</label>
              <select className="form-select" {...register('designation.id')}>
                <option value="">— Select Designation —</option>
                {designations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
              <div style={{ minHeight: 20 }}></div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Branch</label>
              <select className="form-select" {...register('branch.id')}>
                <option value="">— Select Branch —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div style={{ minHeight: 20 }}></div>
            </div>

          </div>

          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary px-4">Update Employee</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => nav('/admin/employees')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
