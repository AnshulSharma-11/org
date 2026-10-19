import {
  lastMonths, parseDate, ymKey, dayKey, countBy, sumBy, avg, sum, pct, pretty, statusColor, toSlices,
  hourOf, WEEKDAYS, payslipAmounts, fmtDate,
} from './reportUtils';

const DAY = 864e5;
const norm = (s) => (s == null ? '' : String(s).toUpperCase());

/** Personal analytics for one employee. */
export function buildEmpModel(raw, monthsN, leaveQuota) {
  const { profile, leaves = [], attendance = [], payroll = [], help = [], projects = [] } = raw;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const months = lastMonths(monthsN, now);
  const mIndex = new Map(months.map((m, i) => [m.key, i]));
  const start = months[0].date;
  const zeros = () => months.map(() => 0);
  const bucket = (d) => (d ? mIndex.get(ymKey(d)) : undefined);

  /* ── Attendance ── */
  const att = attendance.filter((r) => { const d = parseDate(r.date); return d && d >= start; });
  const present = att.filter((r) => norm(r.status) === 'PRESENT').length;
  const half = att.filter((r) => norm(r.status) === 'HALF_DAY').length;
  const absent = att.filter((r) => norm(r.status) === 'ABSENT').length;
  const rateOf = (rows) => {
    const p = rows.filter((r) => norm(r.status) === 'PRESENT').length;
    const h = rows.filter((r) => norm(r.status) === 'HALF_DAY').length;
    const a = rows.filter((r) => norm(r.status) === 'ABSENT').length;
    return p + h + a ? ((p + h * 0.5) / (p + h + a)) * 100 : null;
  };
  const byMonth = months.map(() => []);
  att.forEach((r) => { const i = bucket(parseDate(r.date)); if (i != null) byMonth[i].push(r); });
  const hrs = (r) => (r.hoursWorked > 0 ? r.hoursWorked : null);

  const calendar = {};
  attendance.forEach((r) => { const d = parseDate(r.date); if (d) calendar[dayKey(d)] = { status: norm(r.status), hours: r.hoursWorked }; });

  // consecutive present days, counting back from the latest record
  const presentDates = new Set(attendance.filter((r) => norm(r.status) === 'PRESENT').map((r) => dayKey(parseDate(r.date))));
  let streak = 0;
  for (let d = new Date(today); streak < 400; d = new Date(d.getTime() - DAY)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;                        // skip weekends
    if (presentDates.has(dayKey(d))) streak += 1;
    else if (d.getTime() === today.getTime()) continue;           // today not logged yet
    else break;
  }
  const wkHours = WEEKDAYS.map(() => ({ t: 0, n: 0 }));
  att.forEach((r) => { const d = parseDate(r.date); const h = hrs(r); if (d && h != null) { const k = (d.getDay() + 6) % 7; wkHours[k].t += h; wkHours[k].n += 1; } });
  const checkInByMonth = byMonth.map((rows) => avg(rows.map((r) => hourOf(r.checkIn)).filter((v) => v != null)));

  const attendanceM = {
    records: att.length, present, half, absent, rate: rateOf(att), streak,
    avgHours: avg(att.map(hrs).filter((v) => v != null)),
    totalHours: sum(att.map((r) => r.hoursWorked)),
    calendar,
    byStatus: toSlices(countBy(att, (r) => norm(r.status) || 'UNKNOWN'), ['PRESENT', 'HALF_DAY', 'ABSENT', 'ON_LEAVE']),
    rateTrend: byMonth.map((rows) => { const v = rateOf(rows); return v == null ? null : +v.toFixed(1); }),
    hoursTrend: byMonth.map((rows) => { const v = avg(rows.map(hrs).filter((x) => x != null)); return v == null ? 0 : +v.toFixed(2); }),
    presentTrend: byMonth.map((rows) => rows.filter((r) => norm(r.status) === 'PRESENT').length),
    weekdayHours: wkHours.map((x) => (x.n ? +(x.t / x.n).toFixed(2) : 0)),
    checkInTrend: checkInByMonth.map((v) => (v == null ? null : +v.toFixed(2))),
    avgCheckIn: avg(att.map((r) => hourOf(r.checkIn)).filter((v) => v != null)),
  };

  /* ── Leave ── */
  const thisYear = now.getFullYear();
  const approved = leaves.filter((l) => norm(l.status) === 'APPROVED');
  const usedThisYear = sum(approved.filter((l) => parseDate(l.startDate)?.getFullYear() === thisYear).map((l) => l.totalDays));
  const lv = leaves.filter((l) => { const d = parseDate(l.startDate); return d && d >= start; });
  const statuses = ['APPROVED', 'PENDING', 'REJECTED'];
  const monthly = statuses.map((s) => ({ name: pretty(s), color: statusColor(s), values: zeros() }));
  lv.forEach((l) => { const i = bucket(parseDate(l.startDate)); const k = statuses.indexOf(norm(l.status)); if (i != null && k !== -1) monthly[k].values[i] += l.totalDays || 0; });
  const upcoming = leaves
    .filter((l) => ['APPROVED', 'PENDING'].includes(norm(l.status)) && parseDate(l.endDate) >= today)
    .sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate)).slice(0, 5)
    .map((l) => ({ name: `${pretty(l.leaveType)} · ${l.totalDays || '?'} day${l.totalDays === 1 ? '' : 's'}`, date: fmtDate(parseDate(l.startDate)), status: l.status }));
  const leaveM = {
    quota: leaveQuota, used: usedThisYear, remaining: Math.max(0, leaveQuota - usedThisYear),
    usedPct: pct(usedThisYear, leaveQuota), pending: leaves.filter((l) => norm(l.status) === 'PENDING').length,
    requests: lv.length, monthly,
    byType: toSlices(sumBy(approved, (l) => norm(l.leaveType) || 'OTHER', (l) => l.totalDays || 1)).map((s, i) => ({ ...s, color: `var(--ch-${(i % 8) + 1})` })),
    byStatus: toSlices(countBy(lv, (l) => norm(l.status) || 'UNKNOWN'), statuses),
    upcoming,
  };

  /* ── Payroll ── */
  const pr = payroll.filter((p) => p.year && p.month && new Date(p.year, p.month - 1, 1) >= start)
    .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
  const amounts = pr.map((p) => ({ p, a: payslipAmounts(p.payslipData) }));
  const net = months.map(() => null), ded = months.map(() => 0), basic = months.map(() => 0);
  amounts.forEach(({ p, a }) => {
    const i = mIndex.get(ymKey(new Date(p.year, p.month - 1, 1)));
    if (i == null || !a) return;
    if (a.net != null) net[i] = (net[i] || 0) + a.net;
    ded[i] += a.deductions || 0; basic[i] += (a.basic || 0) + (a.hra || 0);
  });
  const netVals = net.filter((v) => v != null);
  const payM = {
    slips: pr.length, hasSalary: netVals.length > 0,
    latest: amounts.length ? amounts[amounts.length - 1].a?.net ?? null : null,
    avgNet: avg(netVals), ytd: sum(amounts.filter(({ p }) => p.year === thisYear).map(({ a }) => a?.net)),
    net, ded, basic,
    byStatus: toSlices(countBy(pr, (p) => norm(p.status) || 'UNKNOWN'), ['DRAFT', 'PROCESSED', 'PAID']),
    paid: pr.filter((p) => norm(p.status) === 'PAID').length,
  };

  /* ── Projects ── */
  const open = projects.filter((p) => !['COMPLETED', 'CANCELLED', 'CLOSED'].includes(norm(p.status)));
  const dl = open.map((p) => ({ p, d: parseDate(p.deadline) })).filter((x) => x.d).sort((a, b) => a.d - b.d);
  const projM = {
    total: projects.length, active: projects.filter((p) => norm(p.status) === 'IN_PROGRESS').length,
    completed: projects.filter((p) => norm(p.status) === 'COMPLETED').length,
    overdue: dl.filter((x) => x.d < today).length,
    byStatus: toSlices(countBy(projects, (p) => norm(p.status) || 'UNKNOWN'), ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD']),
    byPriority: toSlices(countBy(projects, (p) => norm(p.priority) || 'UNKNOWN'), ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    deadlines: dl.slice(0, 6).map((x) => ({ name: x.p.name, date: fmtDate(x.d), overdue: x.d < today })),
  };

  /* ── Help desk ── */
  const hp = help.filter((h) => { const d = h.createdAt ? new Date(h.createdAt) : null; return d && d >= start; });
  const raised = zeros();
  hp.forEach((h) => { const i = bucket(new Date(h.createdAt)); if (i != null) raised[i] += 1; });
  const helpM = {
    total: hp.length, open: help.filter((h) => ['OPEN', 'IN_PROGRESS'].includes(norm(h.status))).length,
    resolved: help.filter((h) => ['RESOLVED', 'CLOSED'].includes(norm(h.status))).length,
    raised, byStatus: toSlices(countBy(hp, (h) => norm(h.status) || 'UNKNOWN'), ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    byType: toSlices(countBy(hp, (h) => norm(h.requestType) || 'OTHER')).map((s, i) => ({ ...s, color: `var(--ch-${(i % 8) + 1})` })),
  };

  const hire = parseDate(profile?.hireDate);
  const tenure = hire ? (today - hire) / (365.25 * DAY) : null;

  /* ── Highlights ── */
  const insights = [];
  if (attendanceM.rate != null) insights.push(`Your attendance rate for this period is ${attendanceM.rate.toFixed(1)}%.`);
  if (attendanceM.streak >= 2) insights.push(`You are on a ${attendanceM.streak}-day present streak. Keep it going!`);
  if (attendanceM.avgHours) insights.push(`You log about ${attendanceM.avgHours.toFixed(1)} working hours on an average day.`);
  insights.push(`You have used ${leaveM.used} of ${leaveQuota} leave days this year — ${leaveM.remaining} remaining.`);
  if (leaveM.pending) insights.push(`${leaveM.pending} leave request${leaveM.pending === 1 ? ' is' : 's are'} awaiting approval.`);
  if (projM.overdue) insights.push(`${projM.overdue} of your projects ${projM.overdue === 1 ? 'is' : 'are'} past the deadline.`);
  if (tenure != null) insights.push(`You have been with the company for ${tenure >= 1 ? `${tenure.toFixed(1)} years` : `${Math.max(1, Math.round(tenure * 12))} months`}.`);

  return { months, labels: months.map((m) => m.label), attendance: attendanceM, leave: leaveM, payroll: payM, projects: projM, help: helpM, tenure, insights };
}
