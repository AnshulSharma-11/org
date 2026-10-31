import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('react-router-dom', () => {
  const R = require('react');
  return {
    Link: ({ to, children, ...p }) => R.createElement('a', { href: to, ...p }, children),
    MemoryRouter: ({ children }) => R.createElement(R.Fragment, null, children),
  };
}, { virtual: true });
const { MemoryRouter } = require('react-router-dom');

jest.mock('./config/authFetch', () => ({
  __esModule: true,
  default: jest.fn(),
}));
import authFetch from './config/authFetch';

import AttendanceCalendar from './userComponents/attendance/AttendanceCalendar';
import AttendancePunchCard, { fmtDuration } from './userComponents/attendance/AttendancePunchCard';
import AttendanceDashboard from './adminComponents/attendance/AttendanceDashboard';

const ok = (data) => Promise.resolve({ ok: true, json: () => Promise.resolve({ data }) });

async function mount(el) {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => { root.render(el); });
  await act(async () => { await Promise.resolve(); });
  return div;
}

test('fmtDuration', () => {
  expect(fmtDuration(3661)).toBe('01:01:01');
  expect(fmtDuration(-5)).toBe('00:00:00');
});

test('calendar renders statuses', async () => {
  const div = await mount(
    <AttendanceCalendar year={2026} month={10} records={[
      { date: '2026-10-01', status: 'PRESENT', hoursWorked: 8.5 },
      { date: '2026-10-02', status: 'PRESENT', late: true, hoursWorked: 7 },
      { date: '2026-10-05', status: 'ON_LEAVE' },
      { date: '2026-10-06', status: 'ABSENT' },
    ]} />);
  expect(div.querySelectorAll('.att-cal-cell.present').length).toBe(1);
  expect(div.querySelectorAll('.att-cal-cell.late').length).toBe(1);
  expect(div.querySelectorAll('.att-cal-cell.leave').length).toBe(1);
  expect(div.querySelectorAll('.att-cal-cell.absent').length).toBe(1);
  expect(div.textContent).toContain('October 2026');
});

test('punch card: shows check-in, then WORKING buttons after click', async () => {
  const today = { date: '2026-10-30', state: 'NOT_CHECKED_IN', workedSeconds: 0, breakSeconds: 0, late: false,
    weekend: false, shiftStart: '10:00', canCheckIn: true, canCheckOut: false, canStartBreak: false, canResume: false };
  const working = { ...today, state: 'WORKING', checkIn: '2026-10-30T10:05:00', late: true,
    canCheckIn: false, canCheckOut: true, canStartBreak: true };
  authFetch.mockImplementation((url, opts) =>
    url.endsWith('/check-in') ? ok(working) : ok(today));

  const div = await mount(<AttendancePunchCard employeeId={7} />);
  expect(div.textContent).toContain('Not checked in');
  const btn = [...div.querySelectorAll('button')].find(b => b.textContent.includes('Check in'));
  expect(btn).toBeTruthy();
  await act(async () => { btn.click(); });
  await act(async () => { await Promise.resolve(); });
  expect(div.textContent).toContain('Working');
  expect(div.textContent).toContain('Late');
  expect(div.textContent).toContain('Start break');
  expect(div.textContent).toContain('Check out');
});

test('admin dashboard renders kpis, live row and trends', async () => {
  const stats = { date: '2026-10-30', weekend: false, today: true, expected: 10, present: 7, onTime: 5, late: 2,
    working: 4, onBreak: 1, onLeave: 1, absent: 2, attendancePercent: 70 };
  const live = [{ recordId: 1, employeeId: 3, employeeCode: 'E003', name: 'Asha Rao', department: 'Eng',
    designation: 'Dev', checkIn: '2026-10-30T10:05:00', late: true, liveStatus: 'ON_BREAK', workedSeconds: 7322 }];
  const trends = { range: '7d', granularity: 'day', points: [
    { label: '2026-10-29', present: 8, absent: 1, late: 2, leave: 1, avgHours: 7.5 },
    { label: '2026-10-30', present: 7, absent: 0, late: 2, leave: 1, avgHours: 6.1 } ] };
  authFetch.mockImplementation((url) => {
    if (url.includes('/attendance/stats')) return ok(stats);
    if (url.includes('/attendance/live')) return ok(live);
    if (url.includes('/attendance/trends')) return ok(trends);
    if (url.includes('/departments')) return ok({ content: [{ id: 1, name: 'Eng' }] });
    return ok(null);
  });
  const div = await mount(<MemoryRouter><AttendanceDashboard /></MemoryRouter>);
  await act(async () => { await new Promise(r => setTimeout(r, 20)); });
  expect(div.textContent).toContain('Live Attendance');
  expect(div.textContent).toContain('70% attendance');
  expect(div.textContent).toContain('Asha Rao');
  expect(div.textContent).toContain('On break');
  expect(div.textContent).toContain('02:02:02');
  expect(div.textContent).toContain('Not checked in');
});
