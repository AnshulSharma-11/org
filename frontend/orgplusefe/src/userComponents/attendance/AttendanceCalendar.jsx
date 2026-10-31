import React from 'react';

let pad = (n) => String(n).padStart(2, '0');

/** Colour class for one record (or lack of it). */
function cellKind(rec, date, isWeekend, isFuture) {
  if (rec) {
    let st = String(rec.status || '').toUpperCase();
    if (st === 'ON_LEAVE') return 'leave';
    if (st === 'ABSENT') return 'absent';
    if (st === 'HALF_DAY') return 'half';
    if (st === 'WEEKEND') return 'weekend';
    if (st === 'PRESENT') return rec.late ? 'late' : 'present';
  }
  if (isWeekend) return 'weekend';
  return isFuture ? 'future' : 'none';
}

export let CAL_LEGEND = [
  { kind: 'present', label: 'Present' },
  { kind: 'late',    label: 'Late' },
  { kind: 'half',    label: 'Half day' },
  { kind: 'leave',   label: 'On leave' },
  { kind: 'absent',  label: 'Absent' },
  { kind: 'weekend', label: 'Weekend' },
];

/** Month grid. `month` is 1–12. `records` are the employee's time records. */
export default function AttendanceCalendar({ year, month, records }) {
  let y = Number(year);
  let m = Number(month);
  let first = new Date(y, m - 1, 1);
  let daysInMonth = new Date(y, m, 0).getDate();
  let lead = first.getDay();                       // Sunday = 0
  let todayKey = (() => {
    let t = new Date();
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  })();

  let byDate = {};
  (records || []).forEach((r) => { if (r.date) byDate[r.date] = r; });

  let cells = [];
  for (let i = 0; i < lead; i++) cells.push(<div key={`b${i}`} className="att-cal-cell blank" />);
  for (let d = 1; d <= daysInMonth; d++) {
    let key = `${y}-${pad(m)}-${pad(d)}`;
    let dow = new Date(y, m - 1, d).getDay();
    let rec = byDate[key];
    let kind = cellKind(rec, key, dow === 0 || dow === 6, key > todayKey);
    let tip = rec
      ? `${key} · ${rec.status}${rec.late ? ' (late)' : ''}${rec.hoursWorked != null ? ` · ${rec.hoursWorked}h` : ''}`
      : key;
    cells.push(
      <div key={key} className={`att-cal-cell ${kind} ${key === todayKey ? 'today' : ''}`} title={tip}>
        <span className="d">{d}</span>
        {rec && rec.hoursWorked != null && <span className="h">{rec.hoursWorked}h</span>}
      </div>
    );
  }

  return (
    <div className="hrms-card att-cal-card">
      <div className="att-cal-title">
        <i className="bi bi-calendar3 me-2"></i>
        {first.toLocaleString([], { month: 'long', year: 'numeric' })}
      </div>
      <div className="att-cal">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="att-cal-dow">{d}</div>
        ))}
        {cells}
      </div>
      <div className="att-cal-legend">
        {CAL_LEGEND.map((l) => (
          <span key={l.kind}><i className={`sw ${l.kind}`} />{l.label}</span>
        ))}
      </div>
    </div>
  );
}
