import authFetch from '../../config/authFetch';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';
import DisplayTimeRecords from './DisplayTimeRecords';

// ── Filter bar (sort removed) ─────────────────────────────────────────────────
function FilterBar({ onFilter }) {
  let { register, handleSubmit, reset } = useForm();
  return (
    <form className="filter-bar" onSubmit={handleSubmit(onFilter)}>
      <input
        className="form-control"
        style={{ maxWidth: 180 }}
        placeholder="Employee ID"
        {...register('employeeId')}
      />
      <select className="form-select" style={{ maxWidth: 160 }} {...register('status')}>
        <option value="">All Status</option>
        <option value="PRESENT">Present</option>
        <option value="ABSENT">Absent</option>
        <option value="HALF_DAY">Half Day</option>
        <option value="ON_LEAVE">On Leave</option>
      </select>
      <input
        type="date"
        className="form-control"
        style={{ maxWidth: 160 }}
        {...register('dateFrom')}
      />
      <input
        type="date"
        className="form-control"
        style={{ maxWidth: 160 }}
        {...register('dateTo')}
      />
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

// ── Mark Attendance collapsible panel ─────────────────────────────────────────
function MarkAttendancePanel({ onSuccess }) {
  let [open, setOpen]       = useState(false);
  let [saving, setSaving]   = useState(false);
  let panelRef              = useRef(null);
  const today               = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { date: today, status: 'PRESENT' } });

  async function onSubmit(data) {
    setSaving(true);
    try {
      let payload = {
        employee:     { id: parseInt(data.employeeId, 10) },
        date:         data.date,
        status:       data.status,
        checkInTime:  data.checkInTime  || null,
        checkOutTime: data.checkOutTime || null,
        notes:        data.notes        || null,
      };
      let res = await authFetch(`${ADMIN_BASE}/time-records`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Attendance marked!');
        reset({ date: today, status: 'PRESENT' });
        setOpen(false);
        onSuccess();
      } else {
        let b = await res.json();
        toast.error(b.message || 'Failed to mark attendance');
      }
    } catch {
      toast.error('Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-3">
      {/* Toggle button */}
      <button
        type="button"
        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <i className={`bi bi-${open ? 'dash' : 'plus'}-circle`}></i>
        Mark Attendance
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 11 }}></i>
      </button>

      {/* Collapsible panel */}
      <div
        ref={panelRef}
        style={{
          overflow:   'hidden',
          maxHeight:  open ? 600 : 0,
          opacity:    open ? 1 : 0,
          transition: 'max-height 0.28s ease, opacity 0.2s ease',
          marginTop:  open ? 10 : 0,
        }}
      >
        <div className="hrms-form-card" style={{ padding: '18px 20px', margin: 0 }}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="row g-3">

              {/* Employee ID */}
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: 13 }}>
                  Employee ID <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className={`form-control form-control-sm ${errors.employeeId ? 'is-invalid' : ''}`}
                  placeholder="e.g. 3"
                  {...register('employeeId', { required: 'Employee ID is required' })}
                />
                {errors.employeeId && (
                  <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                    {errors.employeeId.message}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: 13 }}>
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control form-control-sm ${errors.date ? 'is-invalid' : ''}`}
                  max={today}
                  {...register('date', { required: 'Date is required' })}
                />
                {errors.date && (
                  <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                    {errors.date.message}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: 13 }}>
                  Status <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select form-select-sm ${errors.status ? 'is-invalid' : ''}`}
                  {...register('status', { required: 'Status is required' })}
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LEAVE">Leave</option>
                </select>
                {errors.status && (
                  <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                    {errors.status.message}
                  </div>
                )}
              </div>

              {/* Check-in time */}
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: 13 }}>Check-in Time</label>
                <input
                  type="time"
                  className="form-control form-control-sm"
                  {...register('checkInTime')}
                />
              </div>

              {/* Check-out time */}
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: 13 }}>Check-out Time</label>
                <input
                  type="time"
                  className="form-control form-control-sm"
                  {...register('checkOutTime')}
                />
              </div>

              {/* Notes */}
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: 13 }}>Notes</label>
                <input
                  className="form-control form-control-sm"
                  placeholder="Optional note"
                  {...register('notes')}
                />
              </div>

            </div>

            <div className="d-flex gap-2 mt-3">
              <button
                className="btn btn-primary btn-sm px-4"
                disabled={saving}
              >
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving…</>
                  : 'Save Attendance'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => { reset({ date: today, status: 'PRESENT' }); setOpen(false); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FetchTimeRecords() {
  let [records, setRecords]   = useState(null);
  let [isRefresh, setIsRefresh] = useState(false);
  let [filters, setFilters]   = useState({});

  useEffect(() => {
    async function load() {
      try {
        let url = `${ADMIN_BASE}/time-records/filter?`;
        if (filters.employeeId) url += `employeeId=${filters.employeeId}&`;
        if (filters.status)     url += `status=${filters.status}&`;
        if (filters.dateFrom)   url += `dateFrom=${filters.dateFrom}&`;
        if (filters.dateTo)     url += `dateTo=${filters.dateTo}&`;
        let res = await authFetch(url);
        let obj = await res.json();
        setRecords(obj.data?.content ?? []);
      } catch {
        setRecords([]);
        toast.error('Failed to load time records');
      }
    }
    load();
  }, [filters, isRefresh]);

  async function deleteRecord(id) {
    try {
      let res = await authFetch(`${ADMIN_BASE}/time-records/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Record deleted'); setIsRefresh(v => !v); }
      else toast.error('Could not delete record');
    } catch {
      toast.error('Could not delete record');
    }
  }

  if (records === null) {
    return (
      <div className="hrms-content">
        <div className="d-flex align-items-center gap-2">
          <span className="spinner-border spinner-border-sm"></span> Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-clock"></i> Attendance Records</h4>
      </div>

      {/* Mark Attendance Panel */}
      <MarkAttendancePanel onSuccess={() => setIsRefresh(v => !v)} />

      {/* Filter + table */}
      <DisplayTimeRecords
        recordsValue={records}
        onDelete={deleteRecord}
        onFilter={setFilters}
        FilterBar={FilterBar}
      />
    </div>
  );
}
