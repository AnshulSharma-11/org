import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import authFetch from '../../config/authFetch';
import { EMPLOYEE_BASE } from '../../config/apiConfig';

export function fmtDuration(totalSeconds) {
  let s = Math.max(0, Math.floor(totalSeconds || 0));
  let h = Math.floor(s / 3600);
  let m = Math.floor((s % 3600) / 60);
  let sec = s % 60;
  let p = (n) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(sec)}`;
}

let fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

let STATE_META = {
  NOT_CHECKED_IN:  { label: 'Not checked in',  cls: 'badge-not_checked_in', icon: 'bi-door-closed' },
  WORKING:         { label: 'Working',         cls: 'badge-working',        icon: 'bi-laptop' },
  ON_BREAK:        { label: 'On break',        cls: 'badge-on_break',       icon: 'bi-cup-hot' },
  CHECKED_OUT:     { label: 'Checked out',     cls: 'badge-checked_out',    icon: 'bi-box-arrow-right' },
  ON_LEAVE:        { label: 'On leave today',  cls: 'badge-on_leave',       icon: 'bi-umbrella' },
  RECORDED_BY_HR:  { label: 'Recorded by HR',  cls: 'badge-checked_out',    icon: 'bi-person-check' },
};

/**
 * Employee punch card: check in / start break / resume / check out.
 * The server decides which buttons are allowed (canCheckIn, canCheckOut, …).
 */
export default function AttendancePunchCard({ employeeId, onChange }) {
  let [info, setInfo]   = useState(null);
  let [busy, setBusy]   = useState(false);
  let [error, setError] = useState(null);
  let [worked, setWorked] = useState(0);
  let [brk, setBrk]       = useState(0);

  let base = `${EMPLOYEE_BASE(employeeId)}/attendance`;

  let apply = useCallback((data) => {
    setInfo(data);
    setWorked(data.workedSeconds);
    setBrk(data.breakSeconds);
    setError(null);
  }, []);

  let load = useCallback(async () => {
    try {
      let res = await authFetch(`${base}/today`);
      let obj = await res.json();
      if (!res.ok) throw new Error(obj.message || 'Request failed');
      apply(obj.data);
    } catch (e) {
      setError(e.message || "Could not load today's attendance");
    }
  }, [base, apply]);

  // Initial load + resync with the server every minute
  useEffect(() => {
    load();
    let id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  // Tick the worked timer while WORKING, and the break timer while ON_BREAK
  let state = info?.state;
  useEffect(() => {
    if (state !== 'WORKING') return undefined;
    let id = setInterval(() => setWorked((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);
  useEffect(() => {
    if (state !== 'ON_BREAK') return undefined;
    let id = setInterval(() => setBrk((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  async function act(path, okMsg) {
    setBusy(true);
    try {
      let res = await authFetch(`${base}/${path}`, { method: 'POST' });
      let obj = await res.json();
      if (!res.ok) {
        toast.error(obj.message || 'Action failed');
        await load();                      // state may have changed elsewhere
        return;
      }
      apply(obj.data);
      toast.success(okMsg);
      if (onChange) onChange();
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setBusy(false);
    }
  }

  if (error && !info) {
    return (
      <div className="hrms-card att-punch">
        <div className="text-muted" style={{ fontSize: 13 }}>
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      </div>
    );
  }
  if (!info) {
    return (
      <div className="hrms-card att-punch">
        <span className="spinner-border spinner-border-sm me-2"></span> Loading attendance…
      </div>
    );
  }

  let meta = STATE_META[info.state] || STATE_META.NOT_CHECKED_IN;
  let showTimer = ['WORKING', 'ON_BREAK', 'CHECKED_OUT'].includes(info.state);

  return (
    <div className="hrms-card att-punch">
      <div className="att-punch-main">
        <div>
          <div className="att-punch-date">
            <i className="bi bi-calendar-event me-1"></i>
            {new Date(`${info.date}T00:00:00`).toLocaleDateString([], {
              weekday: 'long', day: 'numeric', month: 'short',
            })}
            {info.weekend && <span className="ms-2 text-muted">(weekend)</span>}
          </div>
          <div className="mt-2 d-flex flex-wrap align-items-center gap-2">
            <span className={`status-badge ${meta.cls}`}>
              <i className={`bi ${meta.icon} me-1`}></i>{meta.label}
            </span>
            {info.late && <span className="status-badge badge-late">Late</span>}
          </div>
          {info.checkIn && (
            <div className="att-punch-sub mt-2">
              In {fmtTime(info.checkIn)}
              {info.checkOut ? ` · Out ${fmtTime(info.checkOut)}` : ''}
              {' · '}Shift starts {info.shiftStart}
            </div>
          )}
          {!info.checkIn && info.state === 'NOT_CHECKED_IN' && (
            <div className="att-punch-sub mt-2">Shift starts {info.shiftStart}</div>
          )}
        </div>

        {showTimer && (
          <div className="att-punch-timer-wrap">
            <div className="att-punch-timer">{fmtDuration(worked)}</div>
            <div className="att-punch-sub">
              worked today{brk > 0 ? ` · break ${fmtDuration(brk)}` : ''}
            </div>
          </div>
        )}
      </div>

      <div className="att-punch-actions">
        {info.canCheckIn && (
          <button className="btn btn-primary btn-sm px-3" disabled={busy}
                  onClick={() => act('check-in', 'Checked in')}>
            <i className="bi bi-box-arrow-in-right me-1"></i>
            {info.state === 'CHECKED_OUT' ? 'Check in again' : 'Check in'}
          </button>
        )}
        {info.canStartBreak && (
          <button className="btn btn-outline-secondary btn-sm px-3" disabled={busy}
                  onClick={() => act('start-break', 'Break started')}>
            <i className="bi bi-cup-hot me-1"></i>Start break
          </button>
        )}
        {info.canResume && (
          <button className="btn btn-outline-primary btn-sm px-3" disabled={busy}
                  onClick={() => act('resume-work', 'Welcome back')}>
            <i className="bi bi-play-circle me-1"></i>Resume work
          </button>
        )}
        {info.canCheckOut && (
          <button className="btn btn-outline-danger btn-sm px-3" disabled={busy}
                  onClick={() => act('check-out', 'Checked out')}>
            <i className="bi bi-box-arrow-right me-1"></i>Check out
          </button>
        )}
        {info.state === 'ON_LEAVE' && (
          <span className="att-punch-sub">Check-in is disabled while you are on approved leave.</span>
        )}
        {info.state === 'RECORDED_BY_HR' && (
          <span className="att-punch-sub">HR already recorded your attendance for today.</span>
        )}
      </div>
    </div>
  );
}
