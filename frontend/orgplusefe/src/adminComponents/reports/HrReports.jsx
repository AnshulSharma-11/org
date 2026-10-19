import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ADMIN_BASE } from '../../config/apiConfig';
import ReportShell from '../../reports/ReportShell';
import { fetchAll, loadAll, pretty, WEEKDAYS } from '../../reports/reportUtils';
import { buildHrModel } from '../../reports/hrModel';
import {
  BarChart, LineChart, DonutChart, HBars, RingGauge, ChartCard, Kpi, Empty, fmt, tightMin,
} from '../../charts/Charts';

const RANGES = [{ value: 6, label: '6 months' }, { value: 12, label: '12 months' }];

function Skeleton() {
  return (
    <>
      <div className="rp-kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="rp-kpi"><div className="rp-skeleton" style={{ height: 46, width: '100%' }} /></div>)}</div>
      <div className="rp-grid">{[8, 4, 6, 6].map((s, i) => <div key={i} className={`rp-card rp-span-${s}`}><div className="rp-skeleton" /></div>)}</div>
    </>
  );
}

export default function HrReports() {
  const [raw, setRaw] = useState(null);
  const [failed, setFailed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [range, setRange] = useState(6);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, failed: bad } = await loadAll({
      employees:   () => fetchAll(`${ADMIN_BASE}/employees`),
      leaves:      () => fetchAll(`${ADMIN_BASE}/leaves`),
      time:        () => fetchAll(`${ADMIN_BASE}/time-records`),
      payroll:     () => fetchAll(`${ADMIN_BASE}/payroll`),
      performance: () => fetchAll(`${ADMIN_BASE}/performance`),
      projects:    () => fetchAll(`${ADMIN_BASE}/projects`),
      help:        () => fetchAll(`${ADMIN_BASE}/help`),
    });
    Object.keys(data).forEach((k) => { if (!Array.isArray(data[k])) data[k] = []; });
    setRaw(data); setFailed(bad); setUpdatedAt(new Date()); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const m = useMemo(() => (raw ? buildHrModel(raw, range) : null), [raw, range]);
  const L = m?.labels || [];
  const ready = !!m;

  /* ─────────── tab: Overview ─────────── */
  const overview = () => {
    if (!ready) return <Skeleton />;
    const { workforce: w, attendance: a, leave: l, support: s } = m;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-people-fill" tone={1} label="Total employees" value={fmt.num(w.live)} sub={`${w.active} active · ${w.inactive} inactive`} />
          <Kpi icon="bi-person-plus-fill" tone={2} label="New hires (30 days)" value={fmt.num(w.hires30)} sub={`${w.terminated} left in total`} />
          <Kpi icon="bi-box-arrow-right" tone={3} label="Attrition (12 months)" value={fmt.pct(w.attrition)} sub={`${w.exits12} exit${w.exits12 === 1 ? '' : 's'}`} />
          <Kpi icon="bi-hourglass-split" tone={4} label="Average tenure" value={w.avgTenure != null ? `${w.avgTenure.toFixed(1)} yrs` : '—'} sub="current employees" />
          <Kpi icon="bi-calendar-check-fill" tone={1} label="Attendance rate" value={a.rate != null ? fmt.pct(a.rate) : '—'} sub={`${fmt.num(a.presentToday)} present today`} />
          <Kpi icon="bi-umbrella-fill" tone={2} label="On leave today" value={fmt.num(l.onLeaveToday)} sub={`${l.pending} request${l.pending === 1 ? '' : 's'} pending`} />
          <Kpi icon="bi-folder2-open" tone={3} label="Active projects" value={fmt.num(m.projects.active)} sub={`${m.projects.overdue} overdue`} />
          <Kpi icon="bi-headset" tone={4} label="Open help requests" value={fmt.num(s.open)} sub={s.avgResolutionH != null ? `avg ${(s.avgResolutionH / 24).toFixed(1)} days to resolve` : 'no resolved yet'} />
        </div>
        <div className="rp-grid">
          <ChartCard span={8} icon="bi-graph-up" title="Headcount growth" subtitle="Employees on the payroll at the end of each month">
            <LineChart area labels={L} integer yMin={tightMin(w.headcount)} series={[{ name: 'Headcount', values: w.headcount, color: 'var(--ch-1)' }]} label="Headcount trend" />
          </ChartCard>
          <ChartCard span={4} icon="bi-diagram-3" title="Employees by department">
            <DonutChart data={w.byDept.map((d, i) => ({ label: d.label, value: d.value, color: `var(--ch-${(i % 8) + 1})` }))} centerLabel="Employees" />
          </ChartCard>
          <ChartCard span={6} icon="bi-arrow-left-right" title="Hires vs exits" subtitle="Joiners and leavers per month">
            <BarChart labels={L} integer series={[{ name: 'Hires', values: w.hires, color: 'var(--st-ok)' }, { name: 'Exits', values: w.exits, color: 'var(--st-bad)' }]} />
          </ChartCard>
          <ChartCard span={6} icon="bi-calendar-check" title="Attendance rate" subtitle="Present days (half days count 50%) ÷ recorded working days">
            <LineChart area labels={L} format={fmt.pct} yMax={100} yMin={tightMin(a.rateTrend)} series={[{ name: 'Attendance', values: a.rateTrend.map((v) => (v == null ? null : +v.toFixed(1))), color: 'var(--ch-5)' }]} />
          </ChartCard>
          <ChartCard span={12} icon="bi-lightbulb" title="Highlights">
            {m.insights.length ? (
              <ul className="rp-insights">{m.insights.map((t, i) => <li key={i}><i className="bi bi-check2-circle" />{t}</li>)}</ul>
            ) : <Empty text="Highlights will appear as data builds up" icon="bi-lightbulb" />}
          </ChartCard>
        </div>
      </>
    );
  };

  /* ─────────── tab: Workforce ─────────── */
  const workforce = () => {
    if (!ready) return <Skeleton />;
    const w = m.workforce;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-person-check-fill" tone={1} label="Active" value={fmt.num(w.active)} />
          <Kpi icon="bi-person-dash-fill" tone={3} label="Inactive" value={fmt.num(w.inactive)} />
          <Kpi icon="bi-person-x-fill" tone={4} label="Terminated" value={fmt.num(w.terminated)} />
          <Kpi icon="bi-cake2-fill" tone={2} label="Average age" value={w.avgAge != null ? `${Math.round(w.avgAge)} yrs` : '—'} sub={w.unassigned ? `${w.unassigned} without a department` : undefined} />
        </div>
        <div className="rp-grid">
          <ChartCard span={6} icon="bi-building" title="Headcount by department"><HBars data={w.byDept} color="var(--ch-1)" /></ChartCard>
          <ChartCard span={6} icon="bi-geo-alt" title="Headcount by branch"><HBars data={w.byBranch} color="var(--ch-4)" /></ChartCard>
          <ChartCard span={4} icon="bi-gender-ambiguous" title="Gender split"><DonutChart data={w.byGender} centerLabel="Employees" /></ChartCard>
          <ChartCard span={4} icon="bi-activity" title="Employment status"><DonutChart data={w.byStatus} centerLabel="Employees" /></ChartCard>
          <ChartCard span={4} icon="bi-award" title="Top designations"><HBars data={w.byDesignation.slice(0, 6)} color="var(--ch-3)" /></ChartCard>
          <ChartCard span={6} icon="bi-bar-chart" title="Age distribution">
            <BarChart labels={w.ageLabels} integer series={[{ name: 'Employees', values: w.ageDist, color: 'var(--ch-1)' }]} height={230} />
          </ChartCard>
          <ChartCard span={6} icon="bi-hourglass" title="Tenure distribution">
            <BarChart labels={w.tenLabels} integer series={[{ name: 'Employees', values: w.tenureDist, color: 'var(--ch-4)' }]} height={230} />
          </ChartCard>
          <ChartCard span={12} icon="bi-diagram-2" title="Largest teams by manager" subtitle="Direct reports per manager">
            <HBars data={w.managers} color="var(--ch-5)" />
          </ChartCard>
        </div>
      </>
    );
  };

  /* ─────────── tab: Attendance ─────────── */
  const attendance = () => {
    if (!ready) return <Skeleton />;
    const a = m.attendance;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-check2-circle" tone={1} label="Attendance rate" value={a.rate != null ? fmt.pct(a.rate) : '—'} sub={`${fmt.num(a.records)} records`} />
          <Kpi icon="bi-clock-history" tone={2} label="Avg hours / day" value={fmt.hours(a.avgHours)} />
          <Kpi icon="bi-person-check" tone={3} label="Present today" value={fmt.num(a.presentToday)} sub={`${a.loggedToday} logged`} />
          <Kpi icon="bi-person-x" tone={4} label="Absences" value={fmt.num(a.absent)} sub={`${a.half} half days`} />
        </div>
        <div className="rp-grid">
          <ChartCard span={8} icon="bi-graph-up" title="Attendance rate by month">
            <LineChart area labels={L} format={fmt.pct} yMax={100} yMin={tightMin(a.rateTrend)} series={[{ name: 'Attendance', values: a.rateTrend.map((v) => (v == null ? null : +v.toFixed(1))), color: 'var(--ch-5)' }]} />
          </ChartCard>
          <ChartCard span={4} icon="bi-pie-chart" title="Status mix"><DonutChart data={a.byStatus} centerLabel="Records" /></ChartCard>
          <ChartCard span={6} icon="bi-stopwatch" title="Average hours worked" subtitle="Per working day, by month">
            <BarChart labels={L} format={fmt.num} series={[{ name: 'Hours', values: a.hoursTrend.map((v) => v || 0), color: 'var(--ch-1)' }]} height={230} />
          </ChartCard>
          <ChartCard span={6} icon="bi-calendar-week" title="Presence by weekday" subtitle="Total present days">
            <BarChart labels={WEEKDAYS} integer series={[{ name: 'Present', values: a.weekday, color: 'var(--ch-4)' }]} height={230} />
          </ChartCard>
          <ChartCard span={6} icon="bi-alarm" title="Check-in times" subtitle="When people start their day">
            <BarChart labels={a.hourLabels} integer series={[{ name: 'Check-ins', values: a.hourVals, color: 'var(--ch-3)' }]} height={230} />
          </ChartCard>
          <ChartCard span={6} icon="bi-building" title="Attendance rate by department">
            <HBars data={a.deptRate} format={fmt.pct} max={100} color="var(--ch-5)" />
          </ChartCard>
          <ChartCard span={12} icon="bi-exclamation-triangle" title="Most absences" subtitle="Employees with the highest absent-day count">
            <HBars data={a.topAbsent} color="var(--st-bad)" />
          </ChartCard>
        </div>
      </>
    );
  };

  /* ─────────── tab: Leave ─────────── */
  const leave = () => {
    if (!ready) return <Skeleton />;
    const l = m.leave;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-inbox-fill" tone={1} label="Leave requests" value={fmt.num(l.requests)} sub={`${l.pending} pending now`} />
          <Kpi icon="bi-calendar2-check" tone={2} label="Approved days" value={fmt.num(l.approvedDays)} sub={l.avgDays ? `avg ${l.avgDays.toFixed(1)} days / request` : undefined} />
          <Kpi icon="bi-patch-check" tone={3} label="Approval rate" value={l.approvalRate ? fmt.pct(l.approvalRate) : '—'} sub="of decided requests" />
          <Kpi icon="bi-speedometer2" tone={4} label="Avg decision time" value={l.avgDecisionH != null ? (l.avgDecisionH >= 48 ? `${(l.avgDecisionH / 24).toFixed(1)} days` : `${l.avgDecisionH.toFixed(1)} h`) : '—'} />
        </div>
        <div className="rp-grid">
          <ChartCard span={8} icon="bi-bar-chart-steps" title="Leave days by month" subtitle="Stacked by request status (by start date)">
            <BarChart stacked labels={L} integer series={l.monthly} />
          </ChartCard>
          <ChartCard span={4} icon="bi-pie-chart" title="Leave by type" subtitle="Total days"><DonutChart data={l.byType} centerLabel="Days" /></ChartCard>
          <ChartCard span={4} icon="bi-activity" title="Request status"><DonutChart data={l.byStatus} centerLabel="Requests" /></ChartCard>
          <ChartCard span={4} icon="bi-person-lines-fill" title="Top leave takers" subtitle="Approved days"><HBars data={l.topTakers} color="var(--ch-1)" /></ChartCard>
          <ChartCard span={4} icon="bi-building" title="Leave days by department" subtitle="Approved days"><HBars data={l.byDept} color="var(--ch-4)" /></ChartCard>
        </div>
      </>
    );
  };

  /* ─────────── tab: Payroll ─────────── */
  const payroll = () => {
    if (!ready) return <Skeleton />;
    const p = m.payroll;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-receipt" tone={1} label="Payslips generated" value={fmt.num(p.slips)} />
          <Kpi icon="bi-check2-all" tone={2} label="Paid" value={fmt.num(p.paid)} sub={`${p.unpaid} not yet paid`} />
          <Kpi icon="bi-cash-stack" tone={3} label="Total net pay" value={p.hasSalary ? fmt.money(p.totalNet) : '—'} sub={p.hasSalary ? undefined : 'no amounts in payslips'} />
          <Kpi icon="bi-person-workspace" tone={4} label="Avg net pay" value={p.hasSalary ? fmt.money(p.avgNet) : '—'} sub="per payslip" />
        </div>
        <div className="rp-grid">
          <ChartCard span={8} icon="bi-bar-chart-steps" title="Payslips by month" subtitle="Stacked by status">
            <BarChart stacked labels={L} integer series={p.monthly} />
          </ChartCard>
          <ChartCard span={4} icon="bi-bullseye" title="Payment completion">
            <RingGauge percent={p.paidRate} label="Payslips paid" sub={`${p.paid} of ${p.slips}`} color="var(--st-ok)" />
          </ChartCard>
          {p.hasSalary ? (
            <>
              <ChartCard span={8} icon="bi-graph-up" title="Net pay by month" subtitle="Total of payslip net amounts">
                <LineChart area labels={L} format={fmt.money} yMin={tightMin(p.netTrend)} series={[{ name: 'Net pay', values: p.netTrend, color: 'var(--ch-1)' }]} />
              </ChartCard>
              <ChartCard span={4} icon="bi-pie-chart" title="Pay composition"><DonutChart data={p.composition} format={fmt.money} centerLabel="Total" /></ChartCard>
              <ChartCard span={6} icon="bi-building" title="Average net pay by department"><HBars data={p.avgByDept} format={fmt.money} color="var(--ch-3)" /></ChartCard>
              <ChartCard span={6} icon="bi-bar-chart" title="Net pay distribution" subtitle="Number of payslips per pay band (₹)">
                <BarChart labels={p.payDist.labels} integer series={[{ name: 'Payslips', values: p.payDist.values, color: 'var(--ch-4)' }]} height={230} />
              </ChartCard>
            </>
          ) : (
            <ChartCard span={12} icon="bi-info-circle" title="Salary charts">
              <Empty icon="bi-cash-stack" text="Salary graphs appear automatically once payslips contain amounts such as netPay, basicSalary, hra or deductions." />
            </ChartCard>
          )}
        </div>
      </>
    );
  };

  /* ─────────── tab: Performance & Projects ─────────── */
  const work = () => {
    if (!ready) return <Skeleton />;
    const f = m.performance, p = m.projects, sc = f.scale;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-star-fill" tone={1} label="Average rating" value={f.avgRating != null ? `${f.avgRating.toFixed(2)} / ${sc}` : '—'} sub={`${f.rated} rated review${f.rated === 1 ? '' : 's'}`} />
          <Kpi icon="bi-trophy-fill" tone={2} label="Top performers" value={fmt.num(f.topPerformers)} sub={`rated ${Math.round(sc * 0.8)}+ out of ${sc}`} />
          <Kpi icon="bi-kanban-fill" tone={3} label="Project completion" value={fmt.pct(p.completion)} sub={`${p.completed} of ${p.total} projects`} />
          <Kpi icon="bi-alarm-fill" tone={4} label="Overdue projects" value={fmt.num(p.overdue)} sub={`${p.dueSoon} due in 30 days`} />
        </div>
        <div className="rp-section-title">Performance</div>
        <div className="rp-grid">
          <ChartCard span={4} icon="bi-bar-chart" title="Rating distribution">
            <BarChart labels={f.distLabels} integer series={[{ name: 'Reviews', values: f.dist, color: 'var(--ch-1)' }]} height={230} />
          </ChartCard>
          <ChartCard span={4} icon="bi-graph-up" title="Average rating by cycle">
            <LineChart labels={f.cycleLabels} format={fmt.num} yMax={sc} series={[{ name: 'Avg rating', values: f.cycleAvg, color: 'var(--ch-4)' }]} height={230} />
          </ChartCard>
          <ChartCard span={4} icon="bi-clipboard-check" title="Review status"><DonutChart data={f.byStatus} centerLabel="Reviews" /></ChartCard>
          <ChartCard span={4} icon="bi-building" title="Rating by department"><HBars data={f.byDept} max={sc} color="var(--ch-3)" /></ChartCard>
          <ChartCard span={4} icon="bi-arrow-up-circle" title="Highest rated"><HBars data={f.top} max={sc} color="var(--st-ok)" /></ChartCard>
          <ChartCard span={4} icon="bi-arrow-down-circle" title="Needs support" subtitle="Lowest average ratings"><HBars data={f.low} max={sc} color="var(--st-warn)" /></ChartCard>
        </div>
        <div className="rp-section-title">Projects</div>
        <div className="rp-grid">
          <ChartCard span={4} icon="bi-kanban" title="Projects by status"><DonutChart data={p.byStatus} centerLabel="Projects" /></ChartCard>
          <ChartCard span={4} icon="bi-flag" title="Projects by priority"><DonutChart data={p.byPriority} centerLabel="Projects" /></ChartCard>
          <ChartCard span={4} icon="bi-calendar-event" title="Upcoming deadlines">
            {p.upcoming.length ? (
              <ul className="rp-list">
                {p.upcoming.map((u, i) => (
                  <li key={i}>
                    <span className="nm" title={u.name}>{u.name}</span>
                    <span className="mt" style={u.overdue ? { color: 'var(--st-bad)', fontWeight: 700 } : undefined}>{u.overdue ? 'Overdue · ' : ''}{u.date}</span>
                  </li>
                ))}
              </ul>
            ) : <Empty icon="bi-calendar-check" text="No open deadlines" />}
          </ChartCard>
          <ChartCard span={6} icon="bi-people" title="Team size per project"><HBars data={p.teamSize} color="var(--ch-5)" /></ChartCard>
          <ChartCard span={6} icon="bi-person-workspace" title="Employee workload" subtitle="Projects per employee"><HBars data={p.workload} color="var(--ch-1)" /></ChartCard>
        </div>
      </>
    );
  };

  /* ─────────── tab: Support ─────────── */
  const support = () => {
    if (!ready) return <Skeleton />;
    const s = m.support;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-ticket-detailed-fill" tone={1} label="Requests (period)" value={fmt.num(s.total)} />
          <Kpi icon="bi-envelope-open-fill" tone={2} label="Open now" value={fmt.num(s.open)} />
          <Kpi icon="bi-check2-circle" tone={3} label="Resolution rate" value={s.total ? fmt.pct(s.resolvedRate) : '—'} />
          <Kpi icon="bi-stopwatch-fill" tone={4} label="Avg time to resolve" value={s.avgResolutionH != null ? (s.avgResolutionH >= 48 ? `${(s.avgResolutionH / 24).toFixed(1)} days` : `${s.avgResolutionH.toFixed(1)} h`) : '—'} />
        </div>
        <div className="rp-grid">
          <ChartCard span={8} icon="bi-graph-up" title="Requests raised vs resolved">
            <LineChart labels={L} integer series={[{ name: 'Raised', values: s.created, color: 'var(--ch-1)' }, { name: 'Resolved', values: s.resolved, color: 'var(--st-ok)' }]} />
          </ChartCard>
          <ChartCard span={4} icon="bi-activity" title="By status"><DonutChart data={s.byStatus} centerLabel="Requests" /></ChartCard>
          <ChartCard span={6} icon="bi-tags" title="Requests by type"><HBars data={s.byType} color="var(--ch-4)" /></ChartCard>
          <ChartCard span={3} icon="bi-flag" title="By priority"><DonutChart data={s.byPriority} centerLabel="Requests" /></ChartCard>
          <ChartCard span={3} icon="bi-clock" title="Days to resolve" subtitle="Average, by type"><HBars data={s.resByType} format={(v) => `${v}d`} color="var(--ch-3)" /></ChartCard>
        </div>
      </>
    );
  };

  const tabs = [
    { id: 'overview',   label: 'Overview',     icon: 'bi-speedometer2',      render: overview },
    { id: 'workforce',  label: 'Workforce',    icon: 'bi-people',            render: workforce },
    { id: 'attendance', label: 'Attendance',   icon: 'bi-calendar-check',    render: attendance },
    { id: 'leave',      label: 'Leave',        icon: 'bi-umbrella',          render: leave },
    { id: 'payroll',    label: 'Payroll',      icon: 'bi-wallet2',           render: payroll },
    { id: 'work',       label: 'Performance & Projects', icon: 'bi-trophy', render: work },
    { id: 'support',    label: 'Help Desk',    icon: 'bi-headset',           render: support },
  ];

  return (
    <ReportShell
      title="Reports & Analytics"
      subtitle={`Organisation-wide insights · trends cover the last ${range} months`}
      tabs={tabs} ranges={RANGES} range={range} onRange={setRange}
      onRefresh={load} loading={loading} updatedAt={updatedAt} failed={failed.map(pretty)}
    />
  );
}
