import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function UpdatePerformance() {
  let { id } = useParams();
  let { register, handleSubmit, formState:{ errors }, reset } = useForm();
  let nav = useNavigate();
  let [employees, setEmployees] = useState([]);

  useEffect(() => {
    Promise.all([
      authFetch(`${ADMIN_BASE}/performance/${id}`).then(r => r.json()),
      authFetch(`${ADMIN_BASE}/employees?size=200`).then(r => r.json()),
    ]).then(([perfRes, empRes]) => {
      setEmployees(empRes.data?.content ?? empRes.data ?? []);
      let p = perfRes.data;
      reset({ employeeId: p.employee?.id ?? '', reviewerId: p.reviewer?.id ?? '', cycleName: p.cycleName ?? '', startDate: p.startDate ?? '', endDate: p.endDate ?? '', score: p.score ?? '', comments: p.comments ?? '', status: p.status ?? '' });
    }).catch(() => toast.error('Failed to load performance review'));
  }, [id, reset]);

  async function onSubmit(data) {
    try {
      let payload = {
        cycleName: data.cycleName, startDate: data.startDate, endDate: data.endDate,
        score: data.score ? parseInt(data.score,10) : undefined,
        comments: data.comments, status: data.status,
        employee: data.employeeId ? { id: parseInt(data.employeeId,10) } : undefined,
        reviewer: data.reviewerId ? { id: parseInt(data.reviewerId,10) } : undefined,
      };
      let res = await authFetch(`${ADMIN_BASE}/performance/${id}`, { method:'PUT', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success('Performance review updated!'); nav('/admin/performance', { replace:true }); }
      else { let b = await res.json(); toast.error(b.message || 'Failed to update review'); }
    } catch { toast.error('Failed to update performance review'); }
  }

  return (
    <div className="hrms-content">
      <div className="page-header"><h4><i className="bi bi-graph-up-arrow"></i> Update Performance Review</h4></div>
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
              <label className="form-label">Reviewer</label>
              <select className={`form-select ${errors.reviewerId?'is-invalid':''}`} {...register('reviewerId',{ required:'Reviewer is required' })}>
                <option value="">— Select Reviewer —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
              <div style={{ minHeight:20 }}>{errors.reviewerId && <div className="invalid-feedback d-block">{errors.reviewerId.message}</div>}</div>
            </div>
            <div className="col-12">
              <label className="form-label">Cycle Name</label>
              <input className={`form-control ${errors.cycleName?'is-invalid':''}`} placeholder="e.g. Q1 2025" {...register('cycleName',{ required:'Cycle name is required' })} />
              <div style={{ minHeight:20 }}>{errors.cycleName && <div className="invalid-feedback d-block">{errors.cycleName.message}</div>}</div>
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
              <label className="form-label">Score (1–5)</label>
              <select className={`form-select ${errors.score?'is-invalid':''}`} {...register('score',{ required:'Score is required' })}>
                <option value="">— Select Score —</option>
                <option value="1">1 — Poor</option><option value="2">2 — Below Average</option>
                <option value="3">3 — Average</option><option value="4">4 — Good</option><option value="5">5 — Excellent</option>
              </select>
              <div style={{ minHeight:20 }}>{errors.score && <div className="invalid-feedback d-block">{errors.score.message}</div>}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select className={`form-select ${errors.status?'is-invalid':''}`} {...register('status',{ required:'Status is required' })}>
                <option value="">— Select Status —</option>
                <option value="DRAFT">Draft</option><option value="SUBMITTED">Submitted</option><option value="ACKNOWLEDGED">Acknowledged</option>
              </select>
              <div style={{ minHeight:20 }}>{errors.status && <div className="invalid-feedback d-block">{errors.status.message}</div>}</div>
            </div>
            <div className="col-12">
              <label className="form-label">Comments</label>
              <textarea className="form-control" rows={3} placeholder="Review comments" {...register('comments')} />
              <div style={{ minHeight:20 }}></div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary px-4">Update Review</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => nav('/admin/performance')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
