import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function AddLeave() {
  let { register, handleSubmit, formState:{ errors }, control } = useForm();
  let nav = useNavigate();
  let [employees, setEmployees] = useState([]);

  let startDate = useWatch({ control, name:'startDate' });
  let endDate   = useWatch({ control, name:'endDate' });
  let totalDays = 0;
  if (startDate && endDate) {
    let diff = (new Date(endDate) - new Date(startDate)) / (1000*60*60*24);
    if (diff >= 0) totalDays = diff + 1;
  }

  useEffect(() => {
    authFetch(`${ADMIN_BASE}/employees?size=200`).then(r => r.json())
      .then(obj => setEmployees(obj.data?.content ?? obj.data ?? []))
      .catch(() => toast.error('Failed to load employees'));
  }, []);

  async function onSubmit(data) {
    if (totalDays <= 0) { toast.error('End date must be on or after start date'); return; }
    try {
      let payload = {
        leaveType: data.leaveType, startDate: data.startDate, endDate: data.endDate,
        totalDays, reason: data.reason, status: data.status,
        employee: data.employeeId ? { id: parseInt(data.employeeId,10) } : undefined,
      };
      let res = await authFetch(`${ADMIN_BASE}/leaves`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success('Leave added!'); nav('/admin/leaves', { replace:true }); }
      else { let b = await res.json(); toast.error(b.message || 'Failed to add leave'); }
    } catch { toast.error('Failed to add leave'); }
  }

  return (
    <div className="hrms-content">
      <div className="page-header"><h4><i className="bi bi-umbrella"></i> Add Leave</h4></div>
      <div className="hrms-form-card" style={{ maxWidth:720 }}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Employee</label>
              <select className={`form-select ${errors.employeeId?'is-invalid':''}`} {...register('employeeId',{ required:'Employee is required' })}>
                <option value="">— Select Employee —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
              <div style={{ minHeight:20 }}>{errors.employeeId && <div className="invalid-feedback d-block">{errors.employeeId.message}</div>}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Leave Type</label>
              <select className={`form-select ${errors.leaveType?'is-invalid':''}`} {...register('leaveType',{ required:'Leave type is required' })}>
                <option value="">— Select Type —</option>
                <option value="ANNUAL">Annual</option><option value="SICK">Sick</option>
                <option value="CASUAL">Casual</option><option value="UNPAID">Unpaid</option>
              </select>
              <div style={{ minHeight:20 }}>{errors.leaveType && <div className="invalid-feedback d-block">{errors.leaveType.message}</div>}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Start Date</label>
              <input type="date" className={`form-control ${errors.startDate?'is-invalid':''}`} {...register('startDate',{ required:'Start date is required' })} />
              <div style={{ minHeight:20 }}>{errors.startDate && <div className="invalid-feedback d-block">{errors.startDate.message}</div>}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">End Date</label>
              <input type="date" className={`form-control ${errors.endDate?'is-invalid':''}`} {...register('endDate',{ required:'End date is required' })} />
              <div style={{ minHeight:20 }}>{errors.endDate && <div className="invalid-feedback d-block">{errors.endDate.message}</div>}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Total Days</label>
              <input type="number" className="form-control bg-light" readOnly value={totalDays} />
              <div style={{ minHeight:20 }}></div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select className={`form-select ${errors.status?'is-invalid':''}`} {...register('status',{ required:'Status is required' })}>
                <option value="">— Select Status —</option>
                <option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
              </select>
              <div style={{ minHeight:20 }}>{errors.status && <div className="invalid-feedback d-block">{errors.status.message}</div>}</div>
            </div>
            <div className="col-12">
              <label className="form-label">Reason</label>
              <textarea className="form-control" rows={3} placeholder="Reason for leave" {...register('reason')} />
              <div style={{ minHeight:20 }}></div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary px-4">Add Leave</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => nav('/admin/leaves')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
