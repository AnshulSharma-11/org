import { ADMIN_BASE, EMPLOYEE_BASE } from '../config/apiConfig';
import { DEFAULT_LEAVE_QUOTA } from '../config/appConfig';
import {
  fetchAll, fetchObject, parseDate, dayKey, fmtDate, pretty, empName, payslipAmounts, avg,
} from '../reports/reportUtils';
import { extractName } from './engine';

/* ═══════════════════════════════════════════════════════════
   Live-data answers.
   They call the same authenticated endpoints the pages already
   use, so the assistant can only ever see what the signed-in
   person is allowed to see. Results are cached for 45 seconds.
   ═══════════════════════════════════════════════════════════ */

const TTL = 45000;
const cache = new Map();
const cached = (key, load) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.p;
  const p = load().catch((e) => { cache.delete(key); throw e; });
  cache.set(key, { t: Date.now(), p });
  return p;
};
export const clearChatCache = () => cache.clear();

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const norm = (s) => String(s || '').toUpperCase();
const todayDate = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const dm = (d) => `${d.getDate()} ${SHORT[d.getMonth()]}`;
const plural = (n, w, p = `${w}s`) => `${n} ${n === 1 ? w : p}`;
const money = (v) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(v)}`;

/** Wraps a data answer so a network problem becomes a friendly reply. */
const guard = (fn, link) => async (c) => {
  try { return await fn(c); } catch (e) {
    return {
      text: "I couldn't fetch that right now. The server may be busy or unreachable. Please try again in a moment.",
      links: link ? [link] : undefined,
    };
  }
};
const E = (c, p = '') => `/employee/${c.employeeId}${p}`;

/* ───────── loaders ───────── */
const L = {
  eLeaves: (c) => cached(`e${c.employeeId}:leaves`, () => fetchAll(`${EMPLOYEE_BASE(c.employeeId)}/leaves`)),
  eAttendanceMonth: (c) => {
    const t = todayDate(); const from = dayKey(new Date(t.getFullYear(), t.getMonth(), 1));
    return cached(`e${c.employeeId}:att:${from}`, () => fetchAll(`${EMPLOYEE_BASE(c.employeeId)}/attendance?dateFrom=${from}&dateTo=${dayKey(t)}`));
  },
  ePayroll: (c) => cached(`e${c.employeeId}:pay`, () => fetchAll(`${EMPLOYEE_BASE(c.employeeId)}/payroll?sortDirection=desc`)),
  eHelp: (c) => cached(`e${c.employeeId}:help`, () => fetchAll(`${EMPLOYEE_BASE(c.employeeId)}/help`)),
  eProjects: (c) => cached(`e${c.employeeId}:proj`, () => fetchAll(`${EMPLOYEE_BASE(c.employeeId)}/projects`)),
  eProfile: (c) => cached(`e${c.employeeId}:profile`, () => fetchObject(`${EMPLOYEE_BASE(c.employeeId)}/profile`)),

  employees: () => cached('hr:emp', () => fetchAll(`${ADMIN_BASE}/employees`)),
  leavesByStatus: (s) => cached(`hr:leaves:${s}`, () => fetchAll(`${ADMIN_BASE}/leaves/filter?status=${s}`)),
  attendanceToday: () => { const d = dayKey(todayDate()); return cached(`hr:att:${d}`, () => fetchAll(`${ADMIN_BASE}/time-records/filter?dateFrom=${d}&dateTo=${d}`)); },
  helpByStatus: (s) => cached(`hr:help:${s}`, () => fetchAll(`${ADMIN_BASE}/help/filter?status=${s}`)),
  payroll: () => cached('hr:payroll', () => fetchAll(`${ADMIN_BASE}/payroll`)),
  projects: () => cached('hr:projects', () => fetchAll(`${ADMIN_BASE}/projects`)),
};

/* ═════════════════════ EMPLOYEE ═════════════════════ */
const empLeaveBalance = guard(async (c) => {
  const leaves = await L.eLeaves(c);
  const year = new Date().getFullYear();
  const days = (l) => l.totalDays || 0;
  const used = leaves.filter((l) => norm(l.status) === 'APPROVED' && parseDate(l.startDate)?.getFullYear() === year).reduce((a, l) => a + days(l), 0);
  const pend = leaves.filter((l) => norm(l.status) === 'PENDING');
  const pendDays = pend.reduce((a, l) => a + days(l), 0);
  const left = Math.max(0, DEFAULT_LEAVE_QUOTA - used);
  return {
    text: `You have used **${used}** of your **${DEFAULT_LEAVE_QUOTA}** leave days this year, so **${left}** ${left === 1 ? 'day remains' : 'days remain'}.`
      + (pend.length ? ` ${plural(pend.length, 'request')} (${plural(pendDays, 'day')}) ${pend.length === 1 ? 'is' : 'are'} still waiting for approval.` : ''),
    facts: [['Yearly allowance', plural(DEFAULT_LEAVE_QUOTA, 'day')], ['Approved & used', plural(used, 'day')], ['Pending approval', plural(pendDays, 'day')], ['Remaining', plural(left, 'day')]],
    links: [{ label: 'Apply for Leave', to: E(c, '/leaves/apply') }, { label: 'My Leaves', to: E(c, '/leaves') }],
    chips: ['Status of my leave requests', 'What leave types are there?'],
  };
}, null);

const empLeaveStatus = guard(async (c) => {
  const leaves = [...(await L.eLeaves(c))].sort((a, b) => (parseDate(b.startDate) || 0) - (parseDate(a.startDate) || 0));
  if (!leaves.length) return { text: "You haven't applied for any leave yet.", links: [{ label: 'Apply for Leave', to: E(c, '/leaves/apply') }] };
  const rows = leaves.slice(0, 5);
  const rejected = rows.find((l) => norm(l.status) === 'REJECTED');
  const pend = leaves.filter((l) => norm(l.status) === 'PENDING').length;
  return {
    text: `Here are your ${rows.length === 1 ? 'latest leave request' : `latest ${rows.length} leave requests`}.${pend ? ` ${plural(pend, 'request')} still pending.` : ''}`
      + (rejected && rejected.rejectionNote ? `\n\nRejection note for ${dm(parseDate(rejected.startDate))}: "${rejected.rejectionNote}"` : ''),
    facts: rows.map((l) => [`${pretty(l.leaveType)} · ${dm(parseDate(l.startDate))}${l.endDate && l.endDate !== l.startDate ? `–${dm(parseDate(l.endDate))}` : ''} (${plural(l.totalDays || 0, 'day')})`, pretty(l.status)]),
    links: [{ label: 'My Leaves', to: E(c, '/leaves') }],
  };
}, null);

const empAttendance = guard(async (c) => {
  const rows = await L.eAttendanceMonth(c);
  const month = MONTHS[new Date().getMonth() + 1];
  if (!rows.length) {
    return { text: `No attendance has been recorded for you in ${month} yet. If that looks wrong, raise an **Attendance Issue** help request.`, links: [{ label: 'My Attendance', to: E(c, '/attendance') }] };
  }
  const n = (s) => rows.filter((r) => norm(r.status) === s).length;
  const present = n('PRESENT'), half = n('HALF_DAY'), absent = n('ABSENT'), onLeave = n('ON_LEAVE');
  const counted = present + half + absent;
  const rate = counted ? ((present + half * 0.5) / counted) * 100 : null;
  const hrs = avg(rows.map((r) => (r.hoursWorked > 0 ? r.hoursWorked : null)).filter((v) => v != null));
  return {
    text: `In **${month}** you were present on **${present}** ${present === 1 ? 'day' : 'days'}${absent ? ` and absent on ${absent}` : ''}${rate != null ? `. Your attendance rate is **${rate.toFixed(0)}%**` : ''}.`,
    facts: [['Present', plural(present, 'day')], ['Half days', String(half)], ['Absent', String(absent)], ['On leave', String(onLeave)], ['Avg hours / day', hrs != null ? `${hrs.toFixed(1)} h` : '—']],
    links: [{ label: 'My Attendance', to: E(c, '/attendance') }, { label: 'My Reports', to: E(c, '/reports') }],
  };
}, null);

const empPayslip = guard(async (c) => {
  const all = [...(await L.ePayroll(c))].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
  if (!all.length) return { text: 'There are no payslips for you yet. They appear here after HR runs payroll.', links: [{ label: 'My Payroll', to: E(c, '/payroll') }] };
  const p = all[0];
  const a = payslipAmounts(p.payslipData);
  const st = norm(p.status);
  const msg = st === 'PAID' ? 'and has been **paid**' : st === 'PROCESSED' ? 'and is **processed**, with payment still to come' : 'and is still a **draft**, so payment hasn\'t started';
  return {
    text: `Your latest payslip is for **${MONTHS[p.month]} ${p.year}** ${msg}.`,
    facts: [
      ['Period', `${MONTHS[p.month]} ${p.year}`], ['Status', pretty(p.status)], ['Run date', p.runDate ? fmtDate(parseDate(p.runDate)) : '—'],
      ...(a && a.net != null ? [['Net pay', money(a.net)]] : []),
      ...all.slice(1, 4).map((x) => [`${SHORT[x.month - 1]} ${x.year}`, pretty(x.status)]),
    ],
    links: [{ label: 'My Payroll', to: E(c, '/payroll') }],
  };
}, null);

const empProfile = guard(async (c) => {
  const p = await L.eProfile(c);
  if (!p) return { text: "I couldn't load your profile right now.", links: [{ label: 'My Profile', to: E(c, '/profile') }] };
  const mgr = p.manager ? `${p.manager.firstName || ''} ${p.manager.lastName || ''}`.trim() : null;
  const q = (c.raw || '').toLowerCase();
  let lead = 'Here are your employment details.';
  if (/manager|report/.test(q)) lead = mgr ? `Your reporting manager is **${mgr}**.` : 'No reporting manager is set on your profile yet.';
  else if (/join|hire/.test(q)) lead = p.hireDate ? `You joined on **${fmtDate(parseDate(p.hireDate))}**.` : lead;
  else if (/department/.test(q)) lead = p.department ? `You are in the **${p.department.name}** department.` : lead;
  else if (/designation|title/.test(q)) lead = p.designation ? `Your designation is **${p.designation.title}**.` : lead;
  return {
    text: lead,
    facts: [
      ['Employee code', p.employeeCode || '—'], ['Department', p.department?.name || '—'], ['Designation', p.designation?.title || '—'],
      ['Branch', p.branch?.name || '—'], ['Manager', mgr || '—'], ['Joined', p.hireDate ? fmtDate(parseDate(p.hireDate)) : '—'],
    ],
    links: [{ label: 'My Profile', to: E(c, '/profile') }],
  };
}, null);

const empHelp = guard(async (c) => {
  const all = [...(await L.eHelp(c))].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (!all.length) return { text: "You haven't raised any help requests yet.", links: [{ label: 'Raise a Help Request', to: E(c, '/help/raise') }] };
  const open = all.filter((h) => ['OPEN', 'IN_PROGRESS'].includes(norm(h.status)));
  return {
    text: open.length
      ? `You have **${plural(open.length, 'open request')}**. HR is working on ${open.length === 1 ? 'it' : 'them'}.`
      : 'All your help requests are resolved. 🎉',
    facts: all.slice(0, 4).map((h) => [h.subject || pretty(h.requestType), pretty(h.status)]),
    links: [{ label: 'Raise a Help Request', to: E(c, '/help/raise') }],
  };
}, null);

const empProjects = guard(async (c) => {
  const list = await L.eProjects(c);
  if (!list.length) return { text: "You aren't assigned to any project right now.", links: [{ label: 'My Projects', to: E(c, '/projects') }] };
  const today = todayDate();
  const open = list.filter((p) => !['COMPLETED', 'CANCELLED'].includes(norm(p.status)));
  const sorted = [...open].sort((a, b) => (parseDate(a.deadline) || 9e15) - (parseDate(b.deadline) || 9e15));
  const late = sorted.filter((p) => parseDate(p.deadline) && parseDate(p.deadline) < today).length;
  return {
    text: `You're assigned to **${plural(list.length, 'project')}**, with **${open.length}** still open.${late ? ` **${late}** ${late === 1 ? 'is' : 'are'} past the deadline.` : ''}`,
    facts: sorted.slice(0, 5).map((p) => [p.name, `${p.deadline ? fmtDate(parseDate(p.deadline)) : 'No deadline'} · ${pretty(p.status)}`]),
    links: [{ label: 'My Projects', to: E(c, '/projects') }],
  };
}, null);

/* ═════════════════════ HR ═════════════════════ */
const live = (emps) => emps.filter((e) => norm(e.status) !== 'TERMINATED');

const hrHeadcount = guard(async () => {
  const emps = await L.employees();
  const st = (s) => emps.filter((e) => norm(e.status) === s).length;
  const t = todayDate(); const ago = new Date(t.getTime() - 30 * 864e5);
  const hires = emps.filter((e) => { const h = parseDate(e.hireDate); return h && h >= ago; }).length;
  const byDept = new Map();
  live(emps).forEach((e) => byDept.set(e.department?.name || 'Unassigned', (byDept.get(e.department?.name || 'Unassigned') || 0) + 1));
  const top = [...byDept].sort((a, b) => b[1] - a[1])[0];
  return {
    text: `You have **${live(emps).length}** current employees (${st('ACTIVE')} active)${top ? `. **${top[0]}** is the largest team with ${top[1]}` : ''}.`,
    facts: [['Active', String(st('ACTIVE'))], ['Inactive', String(st('INACTIVE'))], ['Terminated', String(st('TERMINATED'))], ['Joined in last 30 days', String(hires)]],
    links: [{ label: 'Employees', to: '/admin/employees' }, { label: 'Workforce report', to: '/admin/reports' }],
    chips: ['Employees by department', 'Birthdays this month'],
  };
}, { label: 'Employees', to: '/admin/employees' });

const hrDepartments = guard(async (c) => {
  const emps = live(await L.employees());
  const branch = /branch|office|location/i.test(c.raw || '');
  const m = new Map();
  emps.forEach((e) => { const k = (branch ? e.branch?.name : e.department?.name) || 'Unassigned'; m.set(k, (m.get(k) || 0) + 1); });
  const rows = [...m].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return {
    text: `Current employees by **${branch ? 'branch' : 'department'}** (${emps.length} in total):`,
    facts: rows.map(([k, v]) => [k, String(v)]),
    links: [{ label: 'Workforce report', to: '/admin/reports' }],
  };
}, { label: 'Employees', to: '/admin/employees' });

const hrPendingLeaves = guard(async () => {
  const list = [...(await L.leavesByStatus('PENDING'))].sort((a, b) => (parseDate(a.startDate) || 0) - (parseDate(b.startDate) || 0));
  if (!list.length) return { text: 'No leave requests are waiting for approval. You\'re all caught up. ✅', links: [{ label: 'Leave', to: '/admin/leaves' }] };
  return {
    text: `**${plural(list.length, 'leave request')}** ${list.length === 1 ? 'is' : 'are'} waiting for your decision${list.length > 6 ? ' (earliest start dates first)' : ''}:`,
    facts: list.slice(0, 6).map((l) => [empName(l.employee), `${pretty(l.leaveType)} · ${dm(parseDate(l.startDate))}${l.endDate && l.endDate !== l.startDate ? `–${dm(parseDate(l.endDate))}` : ''} (${l.totalDays || 0}d)`]),
    links: [{ label: 'Review Leave Requests', to: '/admin/leaves' }],
    chips: ['How do I approve a leave?', 'Who is on leave today?'],
  };
}, { label: 'Leave', to: '/admin/leaves' });

const hrOnLeaveToday = guard(async () => {
  const t = todayDate();
  const list = (await L.leavesByStatus('APPROVED')).filter((l) => { const a = parseDate(l.startDate), b = parseDate(l.endDate); return a && b && a <= t && t <= b; });
  if (!list.length) return { text: 'Nobody is on approved leave today.', links: [{ label: 'Leave', to: '/admin/leaves' }] };
  return {
    text: `**${plural(list.length, 'person', 'people')}** ${list.length === 1 ? 'is' : 'are'} on approved leave today:`,
    facts: list.slice(0, 8).map((l) => [empName(l.employee), `${pretty(l.leaveType)} · back after ${dm(parseDate(l.endDate))}`]),
    links: [{ label: 'Leave', to: '/admin/leaves' }],
  };
}, { label: 'Leave', to: '/admin/leaves' });

const hrAttendanceToday = guard(async () => {
  const [rows, emps] = await Promise.all([L.attendanceToday(), L.employees()]);
  const activeN = emps.filter((e) => norm(e.status) === 'ACTIVE').length;
  if (!rows.length) {
    return { text: `No attendance has been recorded yet for today. ${activeN} active ${activeN === 1 ? 'employee is' : 'employees are'} awaiting entries.`, links: [{ label: 'Mark Attendance', to: '/admin/time-records' }] };
  }
  const n = (s) => rows.filter((r) => norm(r.status) === s).length;
  const absent = rows.filter((r) => norm(r.status) === 'ABSENT');
  return {
    text: `Today **${n('PRESENT')}** of ${activeN} active employees are marked present.${absent.length ? ` Absent: ${absent.slice(0, 5).map((r) => empName(r.employee)).join(', ')}${absent.length > 5 ? ` and ${absent.length - 5} more` : ''}.` : ''}`,
    facts: [['Present', String(n('PRESENT'))], ['Half day', String(n('HALF_DAY'))], ['Absent', String(n('ABSENT'))], ['On leave', String(n('ON_LEAVE'))], ['Not recorded yet', String(Math.max(0, activeN - rows.length))]],
    links: [{ label: 'Attendance', to: '/admin/time-records' }, { label: 'Attendance report', to: '/admin/reports' }],
  };
}, { label: 'Attendance', to: '/admin/time-records' });

const RANK = { URGENT: 0, CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const hrOpenTickets = guard(async () => {
  const [a, b] = await Promise.all([L.helpByStatus('OPEN'), L.helpByStatus('IN_PROGRESS')]);
  const list = [...a, ...b].sort((x, y) => (RANK[norm(x.priority)] ?? 9) - (RANK[norm(y.priority)] ?? 9));
  if (!list.length) return { text: 'There are no open help requests. 🎉', links: [{ label: 'Help Desk', to: '/admin/help' }] };
  const crit = list.filter((h) => ['CRITICAL', 'URGENT', 'HIGH'].includes(norm(h.priority))).length;
  return {
    text: `**${plural(list.length, 'help request')}** ${list.length === 1 ? 'is' : 'are'} open${crit ? `, **${crit}** of high priority or above` : ''}. The most urgent:`,
    facts: list.slice(0, 5).map((h) => [`${h.subject || pretty(h.requestType)}`, `${empName(h.employee)} · ${pretty(h.priority)}`]),
    links: [{ label: 'Open Help Desk', to: '/admin/help' }],
    chips: ['How do I handle a help request?'],
  };
}, { label: 'Help Desk', to: '/admin/help' });

const hrPayrollStatus = guard(async () => {
  const list = await L.payroll();
  const t = new Date(); const m = t.getMonth() + 1, y = t.getFullYear();
  const cur = list.filter((p) => p.month === m && p.year === y);
  if (!cur.length) {
    return {
      text: `Payroll hasn't been run for **${MONTHS[m]} ${y}** yet.`,
      links: [{ label: 'Run Payroll', to: '/admin/payroll/add' }, { label: 'Payroll', to: '/admin/payroll' }],
      chips: ['How do I run payroll?'],
    };
  }
  const n = (s) => cur.filter((p) => norm(p.status) === s).length;
  const paid = n('PAID');
  return {
    text: `For **${MONTHS[m]} ${y}**, **${paid} of ${cur.length}** payslips are paid${cur.length - paid ? `; **${cur.length - paid}** still need payment` : ' — everyone has been paid ✅'}.`,
    facts: [['Draft', String(n('DRAFT'))], ['Processed', String(n('PROCESSED'))], ['Paid', String(paid)], ['Total payslips', String(cur.length)]],
    links: [{ label: 'Payroll', to: '/admin/payroll' }],
  };
}, { label: 'Payroll', to: '/admin/payroll' });

const hrProjects = guard(async () => {
  const list = (await L.projects()).filter((p) => !['COMPLETED', 'CANCELLED'].includes(norm(p.status)));
  const t = todayDate(); const soon = new Date(t.getTime() + 14 * 864e5);
  const dated = list.map((p) => ({ p, d: parseDate(p.deadline) })).filter((x) => x.d).sort((a, b) => a.d - b.d);
  const late = dated.filter((x) => x.d < t), due = dated.filter((x) => x.d >= t && x.d <= soon);
  if (!late.length && !due.length) return { text: `No projects are overdue or due in the next two weeks. (${list.length} open in total.)`, links: [{ label: 'Projects', to: '/admin/projects' }] };
  return {
    text: `**${late.length}** ${late.length === 1 ? 'project is' : 'projects are'} past the deadline and **${due.length}** ${due.length === 1 ? 'is' : 'are'} due within 14 days.`,
    facts: [...late, ...due].slice(0, 6).map((x) => [x.p.name, `${x.d < t ? 'Overdue · ' : ''}${fmtDate(x.d)}`]),
    links: [{ label: 'Projects', to: '/admin/projects' }],
  };
}, { label: 'Projects', to: '/admin/projects' });

const hrBirthdays = guard(async () => {
  const t = todayDate(); const m = t.getMonth();
  const list = live(await L.employees()).map((e) => ({ e, d: parseDate(e.dob) })).filter((x) => x.d && x.d.getMonth() === m).sort((a, b) => a.d.getDate() - b.d.getDate());
  if (!list.length) return { text: `No employee birthdays in ${MONTHS[m + 1]}.` };
  const today = list.filter((x) => x.d.getDate() === t.getDate());
  return {
    text: (today.length ? `🎂 Today: **${today.map((x) => empName(x.e)).join(', ')}**.\n\n` : '') + `**${plural(list.length, 'birthday')}** in ${MONTHS[m + 1]}:`,
    facts: list.slice(0, 10).map((x) => [`${x.d.getDate()} ${SHORT[m]}`, empName(x.e)]),
  };
}, null);

const hrAnniversaries = guard(async () => {
  const t = todayDate(); const m = t.getMonth();
  const list = live(await L.employees()).map((e) => ({ e, d: parseDate(e.hireDate) }))
    .filter((x) => x.d && x.d.getMonth() === m && x.d.getFullYear() < t.getFullYear()).sort((a, b) => a.d.getDate() - b.d.getDate());
  if (!list.length) return { text: `Nobody has a work anniversary in ${MONTHS[m + 1]}.` };
  return {
    text: `**${plural(list.length, 'work anniversary', 'work anniversaries')}** in ${MONTHS[m + 1]}:`,
    facts: list.slice(0, 10).map((x) => [`${x.d.getDate()} ${SHORT[m]}`, `${empName(x.e)} · ${plural(t.getFullYear() - x.d.getFullYear(), 'year')}`]),
  };
}, null);

const hrNewHires = guard(async () => {
  const t = todayDate(); const ago = new Date(t.getTime() - 30 * 864e5);
  const list = (await L.employees()).map((e) => ({ e, d: parseDate(e.hireDate) })).filter((x) => x.d && x.d >= ago).sort((a, b) => b.d - a.d);
  if (!list.length) return { text: 'Nobody has joined in the last 30 days.', links: [{ label: 'Add Employee', to: '/admin/employees/add' }] };
  return {
    text: `**${plural(list.length, 'person', 'people')}** joined in the last 30 days:`,
    facts: list.slice(0, 8).map((x) => [empName(x.e), `${x.e.department?.name || 'No department'} · ${dm(x.d)}`]),
    links: [{ label: 'Employees', to: '/admin/employees' }],
  };
}, null);

const hrAttrition = guard(async () => {
  const emps = await L.employees();
  const t = todayDate(); const ago = new Date(t.getTime() - 365 * 864e5);
  const exits = emps.map((e) => ({ e, d: parseDate(e.terminationDate) })).filter((x) => x.d && x.d >= ago).sort((a, b) => b.d - a.d);
  const rate = emps.length ? (exits.length / emps.length) * 100 : 0;
  if (!exits.length) return { text: 'No exits recorded in the last 12 months. Attrition is **0%**.' };
  return {
    text: `**${plural(exits.length, 'employee')}** left in the last 12 months, an attrition rate of **${rate.toFixed(1)}%**.`,
    facts: exits.slice(0, 6).map((x) => [empName(x.e), `${x.e.department?.name || '—'} · ${dm(x.d)}`]),
    links: [{ label: 'Workforce report', to: '/admin/reports' }],
  };
}, null);

const hrFindEmployee = guard(async (c) => {
  const q = extractName(c.raw);
  if (!q) return { text: 'Whose details should I look up? Try something like *"find Priya Sharma"* or an employee code.' };
  const parts = q.split(' ');
  const emps = await L.employees();
  const hit = emps.filter((e) => {
    const hay = `${e.firstName || ''} ${e.lastName || ''} ${e.employeeCode || ''} ${e.email || ''}`.toLowerCase();
    return parts.every((p) => hay.includes(p));
  }).sort((a, b) => (norm(a.status) === 'TERMINATED') - (norm(b.status) === 'TERMINATED'));
  if (!hit.length) return { text: `I couldn't find anyone matching **"${q}"**. Check the spelling, or try an employee code or email.`, links: [{ label: 'Browse Employees', to: '/admin/employees' }] };
  if (hit.length === 1) {
    const e = hit[0];
    return {
      text: `Here's what I found for **${empName(e)}**:`,
      facts: [
        ['Code', e.employeeCode || '—'], ['Status', pretty(e.status)], ['Department', e.department?.name || '—'], ['Designation', e.designation?.title || '—'],
        ['Branch', e.branch?.name || '—'], ['Email', e.email || '—'], ['Phone', e.phone || '—'], ['Joined', e.hireDate ? fmtDate(parseDate(e.hireDate)) : '—'],
      ],
      links: [{ label: 'Edit this employee', to: `/admin/employees/update/${e.id}` }],
    };
  }
  return {
    text: `I found **${hit.length} people** matching "${q}". Which one do you mean?`,
    facts: hit.slice(0, 6).map((e) => [empName(e), `${e.department?.name || '—'} · ${e.employeeCode || ''}`]),
    chips: hit.slice(0, 3).map((e) => `Find ${empName(e)}`),
  };
}, { label: 'Employees', to: '/admin/employees' });

const hrBriefing = guard(async (c) => {
  const pick = async (fn) => { try { return await fn(); } catch { return null; } };
  const [pend, onLeaveL, att, openA, openB, pay, proj, emps] = await Promise.all([
    pick(() => L.leavesByStatus('PENDING')), pick(() => L.leavesByStatus('APPROVED')), pick(() => L.attendanceToday()),
    pick(() => L.helpByStatus('OPEN')), pick(() => L.helpByStatus('IN_PROGRESS')), pick(() => L.payroll()),
    pick(() => L.projects()), pick(() => L.employees()),
  ]);
  const t = todayDate(); const facts = []; const todo = [];
  const date = t.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  if (emps) facts.push(['Current employees', String(live(emps).length)]);
  if (att && emps) {
    const present = att.filter((r) => norm(r.status) === 'PRESENT').length;
    facts.push(['Present today', att.length ? `${present} of ${emps.filter((e) => norm(e.status) === 'ACTIVE').length}` : 'not recorded yet']);
    if (!att.length) todo.push("today's attendance hasn't been recorded");
  }
  if (onLeaveL) facts.push(['On leave today', String(onLeaveL.filter((l) => { const a = parseDate(l.startDate), b = parseDate(l.endDate); return a && b && a <= t && t <= b; }).length)]);
  if (pend) { facts.push(['Leave requests pending', String(pend.length)]); if (pend.length) todo.push(`${plural(pend.length, 'leave request')} to review`); }
  if (openA || openB) { const n = (openA || []).length + (openB || []).length; facts.push(['Open help requests', String(n)]); if (n) todo.push(`${plural(n, 'help request')} open`); }
  if (pay) {
    const m = t.getMonth() + 1, y = t.getFullYear(); const cur = pay.filter((p) => p.month === m && p.year === y);
    if (!cur.length) { facts.push(['Payroll this month', 'not run yet']); todo.push(`payroll for ${MONTHS[m]} hasn't been run`); }
    else { const paid = cur.filter((p) => norm(p.status) === 'PAID').length; facts.push(['Payroll this month', `${paid}/${cur.length} paid`]); if (paid < cur.length) todo.push(`${cur.length - paid} payslips unpaid`); }
  }
  if (proj) {
    const late = proj.filter((p) => !['COMPLETED', 'CANCELLED'].includes(norm(p.status)) && parseDate(p.deadline) && parseDate(p.deadline) < t).length;
    facts.push(['Overdue projects', String(late)]); if (late) todo.push(`${plural(late, 'project')} overdue`);
  }
  const bday = emps ? live(emps).filter((e) => { const d = parseDate(e.dob); return d && d.getMonth() === t.getMonth() && d.getDate() === t.getDate(); }) : [];
  return {
    text: `**Briefing for ${date}**\n\n${todo.length ? `Needs attention: ${todo.join('; ')}.` : 'Nothing urgent. Everything looks on track. ✅'}${bday.length ? `\n\n🎂 Birthday today: ${bday.map(empName).join(', ')}` : ''}`,
    facts,
    links: [{ label: 'Open Reports', to: '/admin/reports' }, { label: 'Dashboard', to: '/admin' }],
    chips: ['Pending leave requests', 'Open help requests'],
  };
}, { label: 'Dashboard', to: '/admin' });

export const DATA = {
  empLeaveBalance, empLeaveStatus, empAttendance, empPayslip, empProfile, empHelp, empProjects,
  hrHeadcount, hrDepartments, hrPendingLeaves, hrOnLeaveToday, hrAttendanceToday, hrOpenTickets, hrPayrollStatus,
  hrProjects, hrBirthdays, hrAnniversaries, hrNewHires, hrAttrition, hrFindEmployee, hrBriefing,
};
