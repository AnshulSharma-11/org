import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE, EMPLOYEE_BASE } from '../../config/apiConfig';

export default function RaiseHelpRequest() {
  let { employeeId } = useParams();
  let { register, handleSubmit, formState: { errors }, watch } = useForm();
  let nav = useNavigate();
  let [departments, setDepartments] = useState([]);

  let watchedRequestType = watch('requestType');

  useEffect(() => {
    authFetch(`${ADMIN_BASE}/departments?size=200`)
      .then(r => r.json())
      .then(obj => setDepartments(obj.data?.content ?? []))
      .catch(() => toast.error('Failed to load departments'));
  }, []);

  async function onSubmit(data) {
    try {
      let payload = {
        requestType: data.requestType,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        ...(data.requestType === 'DEPARTMENT_CHANGE' && data.currentDepartmentId && {
          currentDepartment: { id: parseInt(data.currentDepartmentId, 10) },
        }),
        ...(data.requestType === 'DEPARTMENT_CHANGE' && data.requestedDepartmentId && {
          requestedDepartment: { id: parseInt(data.requestedDepartmentId, 10) },
        }),
      };

      let res = await authFetch(`${EMPLOYEE_BASE(employeeId)}/help`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Help request submitted!');
        nav(`/employee/${employeeId}`, { replace: true });
      } else {
        toast.error('Failed to submit help request');
      }
    } catch {
      toast.error('Failed to submit help request');
    }
  }

  return (
    <div>
      <div className="page-header">
        <h4><i className="bi bi-headset"></i> Raise Help Request</h4>
      </div>

      <div className="hrms-form-card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          <div className="mb-3">
            <label className="form-label">Request Type</label>
            <select
              className={`form-select ${errors.requestType ? 'is-invalid' : ''}`}
              {...register('requestType', { required: 'Request type is required' })}
            >
              <option value="">— Select Type —</option>
              <option value="COMPLAINT">Complaint</option>
              <option value="DEPARTMENT_CHANGE">Department Change</option>
              <option value="DESIGNATION_CHANGE">Designation Change</option>
              <option value="PAYROLL_ISSUE">Payroll Issue</option>
              <option value="ATTENDANCE_ISSUE">Attendance Issue</option>
              <option value="LEAVE_ISSUE">Leave Issue</option>
              <option value="GENERAL_SUPPORT">General Support</option>
              <option value="TECHNICAL_SUPPORT">Technical Support</option>
            </select>
            <div style={{ minHeight: 20 }}>
              {errors.requestType && (
                <div className="invalid-feedback d-block">{errors.requestType.message}</div>
              )}
            </div>
          </div>

          {/* Conditional department fields */}
          {watchedRequestType === 'DEPARTMENT_CHANGE' && (
            <>
              <div className="mb-3">
                <label className="form-label">Current Department</label>
                <select className="form-select" {...register('currentDepartmentId')}>
                  <option value="">— Select Department —</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <div style={{ minHeight: 20 }}></div>
              </div>

              <div className="mb-3">
                <label className="form-label">Requested Department</label>
                <select className="form-select" {...register('requestedDepartmentId')}>
                  <option value="">— Select Department —</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <div style={{ minHeight: 20 }}></div>
              </div>
            </>
          )}

          <div className="mb-3">
            <label className="form-label">Subject</label>
            <input
              className={`form-control ${errors.subject ? 'is-invalid' : ''}`}
              placeholder="Brief subject (max 200 characters)"
              maxLength={200}
              {...register('subject', {
                required: 'Subject is required',
                maxLength: { value: 200, message: 'Max 200 characters' },
              })}
            />
            <div style={{ minHeight: 20 }}>
              {errors.subject && (
                <div className="invalid-feedback d-block">{errors.subject.message}</div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Describe the issue in detail..."
              {...register('description')}
            />
            <div style={{ minHeight: 20 }}></div>
          </div>

          <div className="mb-3">
            <label className="form-label">Priority</label>
            <select
              className={`form-select ${errors.priority ? 'is-invalid' : ''}`}
              {...register('priority', { required: 'Priority is required' })}
            >
              <option value="">— Select Priority —</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <div style={{ minHeight: 20 }}>
              {errors.priority && (
                <div className="invalid-feedback d-block">{errors.priority.message}</div>
              )}
            </div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary px-4">Submit Request</button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => nav(`/employee/${employeeId}`)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
