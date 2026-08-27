import authFetch from '../../config/authFetch';
import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { EMPLOYEE_BASE } from '../../config/apiConfig';

function calcDays(start, end) {
  if (!start || !end) return null;
  let s = new Date(start);
  let e = new Date(end);
  if (e < s) return null;
  return Math.round((e - s) / 86400000) + 1;
}

export default function ApplyLeave() {
  let { employeeId } = useParams();
  let { register, handleSubmit, control, formState: { errors } } = useForm();
  let nav = useNavigate();
  let [submitting, setSubmitting] = useState(false);

  // Watch both date fields so totalDays updates live
  let startDate = useWatch({ control, name: 'startDate' });
  let endDate   = useWatch({ control, name: 'endDate' });
  let totalDays = calcDays(startDate, endDate);

  async function onSubmit(data) {
    if (totalDays === null || totalDays < 1) {
      toast.error('End date must be on or after start date');
      return;
    }
    setSubmitting(true);
    try {
      let payload = {
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate:   data.endDate,
        reason:    data.reason,
      };
      let res = await authFetch(`${EMPLOYEE_BASE(employeeId)}/leaves`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Leave application submitted!');
        nav(`/employee/${employeeId}/leaves`, { replace: true });
      } else {
        let body = await res.json().catch(() => ({}));
        toast.error(body.message || 'Failed to submit leave application');
      }
    } catch {
      toast.error('Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h4><i className="bi bi-calendar-plus"></i> Apply for Leave</h4>
      </div>

      <div className="hrms-form-card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Leave Type */}
          <div className="mb-3">
            <label className="form-label">Leave Type</label>
            <select
              className={`form-select ${errors.leaveType ? 'is-invalid' : ''}`}
              {...register('leaveType', { required: 'Leave type is required' })}
            >
              <option value="">— Select Type —</option>
              <option value="SICK">Sick</option>
              <option value="CASUAL">Casual</option>
              <option value="EARNED">Earned</option>
              <option value="MATERNITY">Maternity</option>
              <option value="UNPAID">Unpaid</option>
            </select>
            <div style={{ minHeight: 20 }}>
              {errors.leaveType && (
                <div className="invalid-feedback d-block">{errors.leaveType.message}</div>
              )}
            </div>
          </div>

          {/* Date row */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                {...register('startDate', { required: 'Start date is required' })}
              />
              <div style={{ minHeight: 20 }}>
                {errors.startDate && (
                  <div className="invalid-feedback d-block">{errors.startDate.message}</div>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                {...register('endDate', { required: 'End date is required' })}
              />
              <div style={{ minHeight: 20 }}>
                {errors.endDate && (
                  <div className="invalid-feedback d-block">{errors.endDate.message}</div>
                )}
              </div>
            </div>
          </div>

          {/* Auto-calculated totalDays display */}
          <div className="mb-3">
            <label className="form-label">Total Days</label>
            <div
              className={`form-control ${
                totalDays === null && startDate && endDate ? 'is-invalid' : ''
              }`}
              style={{
                background: 'var(--bs-secondary-bg, #f8f9fa)',
                cursor: 'default',
                fontWeight: 500,
                color: totalDays !== null ? 'inherit' : '#6c757d',
              }}
            >
              {totalDays !== null
                ? `${totalDays} day${totalDays !== 1 ? 's' : ''}`
                : '— select start and end dates —'}
            </div>
            {totalDays === null && startDate && endDate && (
              <div className="invalid-feedback d-block">
                End date must be on or after start date
              </div>
            )}
            <div className="form-text">Calculated automatically from your selected dates.</div>
          </div>

          {/* Reason */}
          <div className="mb-3">
            <label className="form-label">Reason <span className="text-muted">(optional)</span></label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Optional reason..."
              {...register('reason')}
            />
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary px-4"
              disabled={submitting || totalDays === null}
            >
              {submitting
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting…</>
                : 'Submit Application'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => nav(`/employee/${employeeId}/leaves`)}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
