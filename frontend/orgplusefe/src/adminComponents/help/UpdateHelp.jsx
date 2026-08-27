import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function UpdateHelp() {
  let { id } = useParams();
  let { register, handleSubmit, formState:{ errors }, reset } = useForm();
  let nav = useNavigate();
  let [employees, setEmployees] = useState([]);
  let [ticket, setTicket] = useState(null);

  useEffect(() => {
    Promise.all([
      authFetch(`${ADMIN_BASE}/help/${id}`).then(r => r.json()),
      authFetch(`${ADMIN_BASE}/employees?size=200`).then(r => r.json()),
    ]).then(([helpRes, empRes]) => {
      setEmployees(empRes.data?.content ?? []);
      let h = helpRes.data;
      setTicket(h);
      reset({ status: h.status ?? '', priority: h.priority ?? '', assignedTo: h.assignedTo?.id ?? '' });
    }).catch(() => toast.error('Failed to load help ticket'));
  }, [id, reset]);

  async function onSubmit(data) {
    try {
      let payload = {
        status: data.status, priority: data.priority,
        assignedTo: data.assignedTo ? { id: parseInt(data.assignedTo,10) } : undefined,
      };
      let res = await authFetch(`${ADMIN_BASE}/help/${id}`, { method:'PUT', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success('Help ticket updated!'); nav('/admin/help', { replace:true }); }
      else { let b = await res.json(); toast.error(b.message || 'Failed to update ticket'); }
    } catch { toast.error('Failed to update help ticket'); }
  }

  return (
    <div className="hrms-content">
      <div className="page-header"><h4><i className="bi bi-headphones"></i> Update Help Ticket</h4></div>
      <div className="hrms-form-card" style={{ maxWidth:720 }}>
        {ticket && (
          <div className="mb-4 p-3 rounded" style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }}>
            <div className="mb-2">
              <span style={{ fontWeight:600, fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.05em', color:'#64748b' }}>Subject</span>
              <div style={{ fontWeight:600, color:'#0f172a' }}>{ticket.subject}</div>
            </div>
            <div>
              <span style={{ fontWeight:600, fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.05em', color:'#64748b' }}>Description</span>
              <div style={{ color:'#475569', whiteSpace:'pre-wrap' }}>{ticket.description}</div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select className={`form-select ${errors.status?'is-invalid':''}`} {...register('status',{ required:'Status is required' })}>
                <option value="">— Select Status —</option>
                <option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option>
              </select>
              <div style={{ minHeight:20 }}>{errors.status && <div className="invalid-feedback d-block">{errors.status.message}</div>}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Priority</label>
              <select className={`form-select ${errors.priority?'is-invalid':''}`} {...register('priority',{ required:'Priority is required' })}>
                <option value="">— Select Priority —</option>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option><option value="URGENT">Urgent</option>
              </select>
              <div style={{ minHeight:20 }}>{errors.priority && <div className="invalid-feedback d-block">{errors.priority.message}</div>}</div>
            </div>
            <div className="col-12">
              <label className="form-label">Assigned To <small className="text-muted">(optional)</small></label>
              <select className="form-select" {...register('assignedTo')}>
                <option value="">— Unassigned —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
              <div style={{ minHeight:20 }}></div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary px-4">Update Ticket</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => nav('/admin/help')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
