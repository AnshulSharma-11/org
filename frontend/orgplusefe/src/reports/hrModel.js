import {
  lastMonths, parseDate, ymKey, countBy, sumBy, avgBy, ranked, avg, sum, pct, pretty, empName,
  statusColor, toSlices, hourOf, diffHours, WEEKDAYS, payslipAmounts, fmtDate,
} from './reportUtils';

const DAY = 864e5;
const norm = (s) => (s == null ? '' : String(s).toUpperCase());

/** Builds every dataset used by the HR report page from the raw API lists. */
export function buildHrModel(raw, monthsN) {
  const {
    employees = [], leaves = [], time = [], payroll = [], performance = [], projects = [], help = [],
  } = raw;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const months = lastMonths(monthsN, now);
  const mIndex = new Map(months.map((m, i) => [m.key, i]));
  const periodStart = months[0].date;
  const empById = new Map(employees.map((e) => [e.id, e]));
  const deptOf = (id) => empById.get(id)?.department?.name || 'Unassigned';
  const zeros = () => months.map(() => 0);
  const bucketMonth = (d) => (d ? mIndex.get(ymKey(d)) : undefined);

  /* ═════════ Workforce ═════════ */
  const live = employees.filter((e) => norm(e.status) !== 'TERMINATED');
  const active = employees.filter((e) => norm(e.status) === 'ACTIVE');
  const yearAgo = new Date(today.getTime() - 365 * DAY);
  const exits12 = employees.filter((e) => { const t = parseDate(e.terminationDate); return t && t >= yearAgo; }).length;
  const hires30 = employees.filter((e) => { const h = parseDate(e.hireDate); return h && h >= new Date(today.getTime() - 30 * DAY); }).length;

  const hires = zeros(), exits = zeros();
  employees.forEach((e) => {
    const h = bucketMonth(parseDate(e.hireDate)); if (h != null) hires[h] += 1;
    const t = bucketMonth(parseDate(e.terminationDate)); if (t != null) exits[t] += 1;
  });
  const headcount = months.map((m) => employees.filter((e) => {
    const h = parseDate(e.hireDate); if (!h || h > m.end) return false;
    const t = parseDate(e.terminationDate); return !t || t > m.end;
  }).length);

  const tenureYears = (e) => {
    const h = parseDate(e.hireDate); if (!h) return null;
    const end = parseDate(e.terminationDate) || today;
    return Math.max(0, (end - h) / (365.25 * DAY));
  };
  const tenures = live.map(tenureYears).filter((v) => v != null);
  const bucket = (vals, edges, labels) => {
    const out = labels.map(() => 0);
    vals.forEach((v) => { let i = edges.findIndex((e) => v < e); if (i === -1) i = labels.length - 1; out[i] += 1; });
    return out;
  };
  const ageLabels = ['Under 25', '25–34', '35–44', '45–54', '55+'];
  const ages = live.map((e) => { const d = parseDate(e.dob); return d ? (today - d) / (365.25 * DAY) : null; }).filter((v) => v != null);
  const tenLabels = ['< 1 yr', '1–2 yrs', '2–5 yrs', '5–10 yrs', '10+ yrs'];

  const workforce = {
    total: employees.length, active: active.length, live: live.length,
    inactive: employees.filter((e) => norm(e.status) === 'INACTIVE').length,
    terminated: employees.filter((e) => norm(e.status) === 'TERMINATED').length,
    hires30, exits12, attrition: pct(exits12, employees.length),
    avgTenure: avg(tenures),
    headcount, hires, exits,
    byStatus: toSlices(countBy(employees, (e) => norm(e.status) || 'UNKNOWN'), ['ACTIVE', 'INACTIVE', 'TERMINATED']),
    byDept: ranked(countBy(live, (e) => e.department?.name || 'Unassigned'), { top: 12 }),
    byBranch: ranked(countBy(live, (e) => e.branch?.name || 'Unassigned'), { top: 10 }),
    byDesignation: ranked(countBy(live, (e) => e.designation?.title || 'Unassigned'), { top: 10 }),
    byGender: [...countBy(live, (e) => pretty(e.gender)).entries()].map(([label, value], i) => ({ label, value, color: `var(--ch-${(i % 8) + 1})` })),
    ageDist: bucket(ages, [25, 35, 45, 55], ageLabels), ageLabels,
    tenureDist: bucket(tenures, [1, 2, 5, 10], tenLabels), tenLabels,
    avgAge: avg(ages),
    managers: ranked(countBy(live.filter((e) => e.manager), (e) => empName(e.manager)), { top: 8 }),
    unassigned: live.filter((e) => !e.department).length,
  };

  /* ═════════ Attendance ═════════ */
  const tr = time.filter((r) => { const d = parseDate(r.date); return d && d >= periodStart; });
  const present = tr.filter((r) => norm(r.status) === 'PRESENT').length;
  const half = tr.filter((r) => norm(r.status) === 'HALF_DAY').length;
  const absent = tr.filter((r) => norm(r.status) === 'ABSENT').length;
  const rateOf = (rows) => {
    const p = rows.filter((r) => norm(r.status) === 'PRESENT').length;
    const h = rows.filter((r) => norm(r.status) === 'HALF_DAY').length;
    const a = rows.filter((r) => norm(r.status) === 'ABSENT').length;
    return p + h + a ? ((p + h * 0.5) / (p + h + a)) * 100 : null;
  };
  const trByMonth = months.map(() => []);
  tr.forEach((r) => { const i = bucketMonth(parseDate(r.date)); if (i != null) trByMonth[i].push(r); });
  const hoursOf = (r) => (r.hoursWorked > 0 ? r.hoursWorked : null);
  const wk = WEEKDAYS.map(() => 0);
  tr.filter((r) => norm(r.status) === 'PRESENT').forEach((r) => { const d = parseDate(r.date); if (d) wk[(d.getDay() + 6) % 7] += 1; });
  const hourBuckets = new Map();
  tr.forEach((r) => { const h = hourOf(r.checkIn); if (h != null) { const k = Math.floor(h); hourBuckets.set(k, (hourBuckets.get(k) || 0) + 1); } });
  const hKeys = [...hourBuckets.keys()];
  const hMin = hKeys.length ? Math.max(5, Math.min(...hKeys)) : 7, hMax = hKeys.length ? Math.min(22, Math.max(...hKeys)) : 12;
  const hLabels = [], hVals = [];
  for (let h = hMin; h <= hMax; h++) { hLabels.push(`${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`); hVals.push(hourBuckets.get(h) || 0); }
  const todayRows = time.filter((r) => { const d = parseDate(r.date); return d && d.getTime() === today.getTime(); });
  const deptRate = [...avgBy(tr.filter((r) => ['PRESENT', 'HALF_DAY', 'ABSENT'].includes(norm(r.status))),
    (r) => deptOf(r.employee?.id), (r) => (norm(r.status) === 'PRESENT' ? 100 : norm(r.status) === 'HALF_DAY' ? 50 : 0))]
    .map(([label, value]) => ({ label, value: +value.toFixed(1) })).sort((a, b) => b.value - a.value).slice(0, 10);

  const attendance = {
    records: tr.length, present, half, absent,
    rate: rateOf(tr), avgHours: avg(tr.map(hoursOf).filter((v) => v != null)),
    presentToday: todayRows.filter((r) => norm(r.status) === 'PRESENT').length, loggedToday: todayRows.length,
    byStatus: toSlices(countBy(tr, (r) => norm(r.status) || 'UNKNOWN'), ['PRESENT', 'HALF_DAY', 'ABSENT', 'ON_LEAVE']),
    rateTrend: trByMonth.map(rateOf),
    hoursTrend: trByMonth.map((rows) => avg(rows.map(hoursOf).filter((v) => v != null))),
    weekday: wk, hourLabels: hLabels, hourVals: hVals,
    topAbsent: ranked(countBy(tr.filter((r) => norm(r.status) === 'ABSENT'), (r) => r.employee?.id), { top: 8, label: (id) => empName(empById.get(id)) }),
    deptRate,
  };

  /* ═════════ Leave ═════════ */
  const lv = leaves.filter((l) => { const d = parseDate(l.startDate); return d && d >= periodStart; });
  const days = (l) => l.totalDays ?? 0;
  const statuses = ['APPROVED', 'PENDING', 'REJECTED'];
  const leaveMonthly = statuses.map((s) => ({ name: pretty(s), color: statusColor(s), values: months.map(() => 0) }));
  lv.forEach((l) => {
    const i = bucketMonth(parseDate(l.startDate)); const k = statuses.indexOf(norm(l.status));
    if (i != null && k !== -1) leaveMonthly[k].values[i] += days(l);
  });
  const decided = lv.filter((l) => ['APPROVED', 'REJECTED'].includes(norm(l.status)));
  const approved = lv.filter((l) => norm(l.status) === 'APPROVED');
  const decisionH = decided.map((l) => diffHours(l.appliedAt, l.updatedAt)).filter((v) => v != null);
  const onLeaveToday = leaves.filter((l) => {
    const a = parseDate(l.startDate), b = parseDate(l.endDate);
    return norm(l.status) === 'APPROVED' && a && b && a <= today && today <= b;
  }).length;
  const leave = {
    requests: lv.length, pending: leaves.filter((l) => norm(l.status) === 'PENDING').length,
    approvedDays: sum(approved.map(days)), onLeaveToday,
    approvalRate: pct(approved.length, decided.length), avgDays: avg(lv.map(days).filter((v) => v > 0)),
    avgDecisionH: avg(decisionH),
    byType: toSlices(sumBy(lv, (l) => norm(l.leaveType) || 'OTHER', (l) => days(l) || 1)).map((s, i) => ({ ...s, color: `var(--ch-${(i % 8) + 1})` })),
    byStatus: toSlices(countBy(lv, (l) => norm(l.status) || 'UNKNOWN'), statuses),
    monthly: leaveMonthly,
    topTakers: ranked(sumBy(approved, (l) => l.employee?.id, days), { top: 8, label: (id) => empName(empById.get(id)) }),
    byDept: ranked(sumBy(approved, (l) => deptOf(l.employee?.id), days), { top: 10 }),
  };

  /* ═════════ Payroll ═════════ */
  const pr = payroll.filter((p) => p.year && p.month && new Date(p.year, p.month - 1, 1) >= periodStart);
  const pStatuses = [...new Set(pr.map((p) => norm(p.status) || 'UNKNOWN'))]
    .sort((a, b) => ['DRAFT', 'PROCESSED', 'PAID'].indexOf(a) - ['DRAFT', 'PROCESSED', 'PAID'].indexOf(b));
  const payMonthly = pStatuses.map((s) => ({ name: pretty(s), color: statusColor(s), values: months.map(() => 0) }));
  const netByMonth = months.map(() => 0), netCnt = months.map(() => 0);
  const withAmt = [];
  pr.forEach((p) => {
    const i = mIndex.get(ymKey(new Date(p.year, p.month - 1, 1)));
    const k = pStatuses.indexOf(norm(p.status) || 'UNKNOWN');
    if (i != null && k !== -1) payMonthly[k].values[i] += 1;
    const a = payslipAmounts(p.payslipData);
    if (a && a.net != null && i != null) { netByMonth[i] += a.net; netCnt[i] += 1; withAmt.push({ p, a }); }
  });
  const paid = pr.filter((p) => norm(p.status) === 'PAID').length;
  const hasSalary = withAmt.length > 0;
  const netVals = withAmt.map((x) => x.a.net);
  const nBuckets = 5;
  let payDist = { labels: [], values: [] };
  if (netVals.length) {
    const lo = Math.min(...netVals), hi = Math.max(...netVals), span = (hi - lo) || 1, w = span / nBuckets;
    const cnt = Array(nBuckets).fill(0);
    netVals.forEach((v) => { cnt[Math.min(nBuckets - 1, Math.floor((v - lo) / w))] += 1; });
    const f = (v) => (v >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : Math.round(v));
    payDist = { labels: cnt.map((_, i) => `${f(lo + i * w)}–${f(lo + (i + 1) * w)}`), values: cnt };
  }
  const payroll_ = {
    slips: pr.length, paid, paidRate: pct(paid, pr.length), unpaid: pr.length - paid,
    monthly: payMonthly, hasSalary,
    totalNet: sum(netVals), avgNet: avg(netVals),
    netTrend: months.map((_, i) => (netCnt[i] ? netByMonth[i] : null)),
    avgByDept: [...avgBy(withAmt, (x) => deptOf(x.p.employee?.id), (x) => x.a.net)]
      .map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10),
    composition: [
      { label: 'Basic', value: sum(withAmt.map((x) => x.a.basic)), color: 'var(--ch-1)' },
      { label: 'HRA / allowances', value: sum(withAmt.map((x) => x.a.hra)), color: 'var(--ch-3)' },
      { label: 'Deductions', value: sum(withAmt.map((x) => x.a.deductions)), color: 'var(--ch-6)' },
    ].filter((c) => c.value > 0),
    payDist,
  };

  /* ═════════ Performance ═════════ */
  const rated = performance.filter((p) => p.overallRating != null && !Number.isNaN(+p.overallRating));
  const scale = rated.some((p) => p.overallRating > 5) ? 10 : 5;
  const ratingBuckets = Array.from({ length: scale }, (_, i) => (scale === 5 ? `${i + 1}★` : `${i + 1}`));
  const rDist = Array(scale).fill(0);
  rated.forEach((p) => { rDist[Math.max(1, Math.min(scale, Math.round(p.overallRating))) - 1] += 1; });
  const cycles = new Map();
  rated.forEach((p) => {
    const k = p.cycleName || 'Unnamed cycle';
    const c = cycles.get(k) || { sum: 0, n: 0, t: parseDate(p.startDate)?.getTime() ?? 0 };
    c.sum += +p.overallRating; c.n += 1; cycles.set(k, c);
  });
  const cycleList = [...cycles].sort((a, b) => a[1].t - b[1].t).slice(-10);
  const perEmp = [...avgBy(rated, (p) => p.employee?.id, (p) => +p.overallRating)]
    .map(([id, value]) => ({ label: empName(empById.get(id) || rated.find((p) => p.employee?.id === id)?.employee), value }))
    .sort((a, b) => b.value - a.value);
  const performance_ = {
    total: performance.length, rated: rated.length, scale,
    avgRating: avg(rated.map((p) => +p.overallRating)),
    dist: rDist, distLabels: ratingBuckets,
    byStatus: toSlices(countBy(performance, (p) => norm(p.status) || 'UNKNOWN')),
    cycleLabels: cycleList.map(([k]) => k), cycleAvg: cycleList.map(([, c]) => +(c.sum / c.n).toFixed(2)),
    byDept: [...avgBy(rated, (p) => deptOf(p.employee?.id), (p) => +p.overallRating)]
      .map(([label, value]) => ({ label, value: +value.toFixed(2) })).sort((a, b) => b.value - a.value).slice(0, 10),
    top: perEmp.slice(0, 5).map((x) => ({ ...x, value: +x.value.toFixed(2) })),
    low: perEmp.slice(-5).reverse().map((x) => ({ ...x, value: +x.value.toFixed(2) })),
    topPerformers: rated.filter((p) => p.overallRating >= scale * 0.8).length,
  };

  /* ═════════ Projects ═════════ */
  const open = projects.filter((p) => !['COMPLETED', 'CANCELLED', 'CLOSED'].includes(norm(p.status)));
  const withDeadline = open.map((p) => ({ p, d: parseDate(p.deadline) })).filter((x) => x.d).sort((a, b) => a.d - b.d);
  const projects_ = {
    total: projects.length, active: projects.filter((p) => norm(p.status) === 'IN_PROGRESS').length,
    completed: projects.filter((p) => norm(p.status) === 'COMPLETED').length,
    completion: pct(projects.filter((p) => norm(p.status) === 'COMPLETED').length, projects.length),
    overdue: withDeadline.filter((x) => x.d < today).length,
    dueSoon: withDeadline.filter((x) => x.d >= today && x.d <= new Date(today.getTime() + 30 * DAY)).length,
    byStatus: toSlices(countBy(projects, (p) => norm(p.status) || 'UNKNOWN'), ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD']),
    byPriority: toSlices(countBy(projects, (p) => norm(p.priority) || 'UNKNOWN'), ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    teamSize: projects.map((p) => ({ label: p.name || `#${p.id}`, value: (p.employees || []).length })).sort((a, b) => b.value - a.value).slice(0, 8),
    workload: ranked(countBy(projects.flatMap((p) => p.employees || []), (e) => e.id), { top: 8, label: (id) => empName(empById.get(id) || projects.flatMap((p) => p.employees || []).find((e) => e.id === id)) }),
    upcoming: withDeadline.slice(0, 6).map((x) => ({ name: x.p.name, date: fmtDate(x.d), overdue: x.d < today, status: x.p.status })),
  };

  /* ═════════ Support (help desk) ═════════ */
  const hp = help.filter((h) => { const d = h.createdAt ? new Date(h.createdAt) : null; return d && d >= periodStart; });
  const created = zeros(), resolved = zeros();
  hp.forEach((h) => { const i = bucketMonth(new Date(h.createdAt)); if (i != null) created[i] += 1; });
  help.forEach((h) => { if (h.resolvedAt) { const i = bucketMonth(new Date(h.resolvedAt)); if (i != null) resolved[i] += 1; } });
  const resH = (h) => (h.resolvedAt ? diffHours(h.createdAt, h.resolvedAt) : null);
  const support = {
    total: hp.length,
    open: help.filter((h) => ['OPEN', 'IN_PROGRESS'].includes(norm(h.status))).length,
    resolvedRate: pct(hp.filter((h) => ['RESOLVED', 'CLOSED'].includes(norm(h.status))).length, hp.length),
    avgResolutionH: avg(hp.map(resH).filter((v) => v != null)),
    created, resolved,
    byType: ranked(countBy(hp, (h) => norm(h.requestType) || 'OTHER'), { top: 8, label: pretty }),
    byStatus: toSlices(countBy(hp, (h) => norm(h.status) || 'UNKNOWN'), ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    byPriority: toSlices(countBy(hp, (h) => norm(h.priority) || 'UNKNOWN'), ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    resByType: [...avgBy(hp, (h) => norm(h.requestType) || 'OTHER', resH)]
      .map(([k, v]) => ({ label: pretty(k), value: +(v / 24).toFixed(1) })).sort((a, b) => b.value - a.value).slice(0, 8),
  };

  /* ═════════ Auto-generated highlights ═════════ */
  const insights = [];
  if (workforce.byDept[0]) insights.push(`${workforce.byDept[0].label} is the largest department with ${workforce.byDept[0].value} employees (${Math.round(pct(workforce.byDept[0].value, workforce.live))}% of the workforce).`);
  if (workforce.hires30 > 0) insights.push(`${workforce.hires30} new ${workforce.hires30 === 1 ? 'hire' : 'hires'} joined in the last 30 days.`);
  if (workforce.exits12 > 0) insights.push(`Attrition over the last 12 months is ${workforce.attrition.toFixed(1)}% (${workforce.exits12} ${workforce.exits12 === 1 ? 'exit' : 'exits'}).`);
  if (attendance.rate != null) insights.push(`Attendance rate for the period is ${attendance.rate.toFixed(1)}%${attendance.avgHours ? `, averaging ${attendance.avgHours.toFixed(1)} working hours a day` : ''}.`);
  const peakLeave = leave.monthly.reduce((acc, s) => s.values.map((v, i) => (acc[i] || 0) + v), []);
  const pk = peakLeave.indexOf(Math.max(...peakLeave, 0));
  if (peakLeave[pk] > 0) insights.push(`Leave demand peaked in ${months[pk].label} with ${peakLeave[pk]} leave day${peakLeave[pk] === 1 ? '' : 's'}.`);
  if (leave.pending > 0) insights.push(`${leave.pending} leave ${leave.pending === 1 ? 'request is' : 'requests are'} waiting for a decision.`);
  if (support.open > 0) insights.push(`${support.open} help-desk ${support.open === 1 ? 'request is' : 'requests are'} still open.`);
  if (projects_.overdue > 0) insights.push(`${projects_.overdue} active ${projects_.overdue === 1 ? 'project is' : 'projects are'} past the deadline.`);

  return {
    months, labels: months.map((m) => m.label), workforce, attendance, leave, payroll: payroll_,
    performance: performance_, projects: projects_, support, insights,
  };
}
