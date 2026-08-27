import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function AddPayrollRun() {
  let { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      year: new Date().getFullYear(),
      runDate: new Date().toISOString().slice(0, 10),
    },
  });
  let nav = useNavigate();
  let [employees, setEmployees] = useState([]);
  let [submitting, setSubmitting] = useState(false);
  let [result, setResult] = useState(null);

  useEffect(() => {
    authFetch(`${ADMIN_BASE}/employees?status=ACTIVE&size=200`)
      .then(r => r.json())
      .then(obj => setEmployees(obj.data?.content ?? []))
      .catch(() => toast.error('Failed to load employees'));
  }, []);

  async function onSubmit(data) {
    setSubmitting(true);
    setResult(null);
    try {
      let payload = {
        month:         parseInt(data.month, 10),
        year:          parseInt(data.year, 10),
        runDate:       data.runDate,
        processedById: data.processedById ? data.processedById : null,
        payslipData:   data.payslipData   ? data.payslipData   : null,
      };
      let res = await authFetch(`${ADMIN_BASE}/payroll/bulk`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      let body = await res.json();
      if (res.ok) {
        toast.success(body.message || 'Payroll run created!');
        setResult({ ok: true, message: body.message, count: Array.isArray(body.data) ? body.data.length : 0 });
      } else {
        toast.error(body.message || 'Failed to create payroll run');
        setResult({ ok: false, message: body.message });
      }
    } catch {
      toast.error('Failed to create payroll run');
    } finally {
      setSubmitting(false);
    }
  }

  let activeCount = employees.length;

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-calendar-check"></i> Run Payroll for Month</h4>
      </div>

      {/* Info banner */}
      <div className="alert alert-info d-flex align-items-start gap-2 mb-4" role="alert">
        <i className="bi bi-info-circle-fill mt-1"></i>
        <div>
          This creates <strong>one payslip per active employee</strong> for the selected month and year.
          {activeCount > 0 && (
            <span> Currently <strong>{activeCount}</strong> active employee{activeCount !== 1 ? 's' : ''} on record.</span>
          )}
          {' '}Employees who already have a payslip for the chosen month+year are skipped automatically.
        </div>
      </div>

      <div className="hrms-form-card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Month + Year row */}
          <div className="row g-3 mb-1">
            <div className="col-md-6">
              <label className="form-label">Month</label>
              <select
                className={`form-select ${errors.month ? 'is-invalid' : ''}`}
                {...register('month', { required: 'Month is required' })}
              >
                <option value="">— Select Month —</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <div style={{ minHeight: 20 }}>
                {errors.month && <div className="invalid-feedback d-block">{errors.month.message}</div>}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Year</label>
              <input
                type="number"
                className={`form-control ${errors.year ? 'is-invalid' : ''}`}
                {...register('year', {
                  required: 'Year is required',
                  min: { value: 2000, message: 'Year must be 2000 or later' },
                })}
              />
              <div style={{ minHeight: 20 }}>
                {errors.year && <div className="invalid-feedback d-block">{errors.year.message}</div>}
              </div>
            </div>
          </div>

          {/* Run Date */}
          <div className="mb-3">
            <label className="form-label">Run Date</label>
            <input
              type="date"
              className={`form-control ${errors.runDate ? 'is-invalid' : ''}`}
              {...register('runDate', { required: 'Run date is required' })}
            />
            <div style={{ minHeight: 20 }}>
              {errors.runDate && <div className="invalid-feedback d-block">{errors.runDate.message}</div>}
            </div>
          </div>

          {/* Processed By */}
          <div className="mb-3">
            <label className="form-label">
              Processed By <span className="text-muted">(optional)</span>
            </label>
            <select className="form-select" {...register('processedById')}>
              <option value="">— Select HR / Finance —</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                  {e.designation?.title ? ` — ${e.designation.title}` : ''}
                </option>
              ))}
            </select>
            <div style={{ minHeight: 20 }}></div>
          </div>

          {/* Default Payslip JSON */}
          <div className="mb-3">
            <label className="form-label">
              Default Payslip Template <span className="text-muted">(optional JSON, applied to all employees)</span>
            </label>
            <textarea
              className="form-control font-monospace"
              rows={5}
              placeholder={'{\n  "basicSalary": 0,\n  "hra": 0,\n  "deductions": 0,\n  "netPay": 0\n}'}
              {...register('payslipData')}
            />
            <div className="form-text">
              Leave blank to create empty payslip shells. You can edit each employee's payslip data individually afterwards.
            </div>
          </div>

          {/* Result banner */}
          {result && (
            <div className={`alert ${result.ok ? 'alert-success' : 'alert-danger'} d-flex align-items-center gap-2`}>
              <i className={`bi ${result.ok ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
              <span>{result.message}</span>
            </div>
          )}

          <div className="d-flex gap-2">
            <button className="btn btn-primary px-4" disabled={submitting}>
              {submitting
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Running Payroll…</>
                : <><i className="bi bi-play-fill me-2"></i>Run Payroll</>}
            </button>
            {result?.ok && (
              <button
                type="button"
                className="btn btn-outline-success"
                onClick={() => nav('/admin/payroll')}
              >
                <i className="bi bi-list-ul me-1"></i> View Payroll Records
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => nav('/admin/payroll')}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
