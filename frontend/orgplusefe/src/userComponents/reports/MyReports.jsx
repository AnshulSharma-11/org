import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EMPLOYEE_BASE } from '../../config/apiConfig';
import { DEFAULT_LEAVE_QUOTA } from '../../config/appConfig';
import ReportShell from '../../reports/ReportShell';
import { fetchAll, fetchObject, loadAll, pretty, WEEKDAYS } from '../../reports/reportUtils';
import { buildEmpModel } from '../../reports/empModel';
import {
  BarChart, LineChart, DonutChart, HBars, RingGauge, CalendarHeatmap, ChartCard, Kpi, Empty, fmt, tightMin,
} from '../../charts/Charts';

const RANGES = [{ value: 3, label: '3 months' }, { value: 6, label: '6 months' }, { value: 12, label: '12 months' }];
const clock = (v) => { if (v == null) return '—'; const h = Math.floor(v); const mm = Math.round((v - h) * 60); return `${h % 12 || 12}:${String(mm === 60 ? 0 : mm).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };

function Skeleton() {
  return (
    <>
      <div className="rp-kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="rp-kpi"><div className="rp-skeleton" style={{ height: 46, width: '100%' }} /></div>)}</div>
      <div className="rp-grid">{[8, 4, 6, 6].map((s, i) => <div key={i} className={`rp-card rp-span-${s}`}><div className="rp-skeleton" /></div>)}</div>
    </>
  );
}

function DeadlineList({ items, empty }) {
  if (!items.length) return <Empty icon="bi-calendar-check" text={empty} />;
  return (
    <ul className="rp-list">
      {items.map((u, i) => (
        <li key={i}>
          <span className="nm" title={u.name}>{u.name}</span>
          <span className="mt" style={u.overdue ? { color: 'var(--st-bad)', fontWeight: 700 } : undefined}>{u.overdue ? 'Overdue · ' : ''}{u.date}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MyReports() {
  const { employeeId } = useParams();
  const [raw, setRaw] = useState(null);
  const [failed, setFailed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [range, setRange] = useState(6);

  const load = useCallback(async () => {
    setLoading(true);
    const base = EMPLOYEE_BASE(employeeId);
    const { data, failed: bad } = await loadAll({
      profile:    () => fetchObject(`${base}/profile`),
      leaves:     () => fetchAll(`${base}/leaves`),
      attendance: () => fetchAll(`${base}/attendance`),
      payroll:    () => fetchAll(`${base}/payroll`),
      help:       () => fetchAll(`${base}/help`),
      projects:   () => fetchAll(`${base}/projects`),
    });
    ['leaves', 'attendance', 'payroll', 'help', 'projects'].forEach((k) => { if (!Array.isArray(data[k])) data[k] = []; });
    setRaw(data); setFailed(bad); setUpdatedAt(new Date()); setLoading(false);
  }, [employeeId]);

  useEffect(() => { load(); }, [load]);

  const m = useMemo(() => (raw ? buildEmpModel(raw, range, DEFAULT_LEAVE_QUOTA) : null), [raw, range]);
  const L = m?.labels || [];
  const ready = !!m;

  /* ─── Overview ─── */
  const overview = () => {
    if (!ready) return <Skeleton />;
    const a = m.attendance, l = m.leave;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-calendar-check-fill" tone={1} label="Attendance rate" value={a.rate != null ? fmt.pct(a.rate) : '—'} sub={`${a.present} present · ${a.absent} absent`} />
          <Kpi icon="bi-fire" tone={2} label="Present streak" value={`${a.streak} day${a.streak === 1 ? '' : 's'}`} sub="working days in a row" />
          <Kpi icon="bi-umbrella-fill" tone={3} label="Leave remaining" value={`${l.remaining} days`} sub={`${l.used} of ${l.quota} used this year`} />
          <Kpi icon="bi-clock-history" tone={4} label="Avg hours / day" value={fmt.hours(a.avgHours)} sub={`${fmt.num(a.totalHours)} h in total`} />
        </div>
        <div className="rp-grid">
          <ChartCard span={12} icon="bi-calendar3" title="Attendance calendar" subtitle="Every working day at a glance — tap or hover a day for details">
            <CalendarHeatmap days={a.calendar} weeks={Math.min(53, Math.round(range * 4.35) + 1)} />
          </ChartCard>
          <ChartCard span={8} icon="bi-graph-up" title="Attendance rate by month">
            <LineChart area labels={L} format={fmt.pct} yMax={100} yMin={tightMin(a.rateTrend)} series={[{ name: 'Attendance', values: a.rateTrend, color: 'var(--ch-5)' }]} height={240} />
          </ChartCard>
          <ChartCard span={4} icon="bi-bullseye" title="Leave used this year">
            <RingGauge percent={l.usedPct} label={`${l.used} of ${l.quota} days used`} sub={`${l.remaining} days left`} color="var(--ch-1)" />
          </ChartCard>
          <ChartCard span={12} icon="bi-lightbulb" title="Your highlights">
            <ul className="rp-insights">{m.insights.map((t, i) => <li key={i}><i className="bi bi-check2-circle" />{t}</li>)}</ul>
          </ChartCard>
        </div>
      </>
    );
  };

  /* ─── Attendance ─── */
  const attendance = () => {
    if (!ready) return <Skeleton />;
    const a = m.attendance;
    const lo = a.checkInTrend.filter((v) => v != null);
    const yMin = lo.length ? Math.max(0, Math.floor(Math.min(...lo)) - 1) : 0;
    const yMax = lo.length ? Math.ceil(Math.max(...lo)) + 1 : 12;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-check2-circle" tone={1} label="Days present" value={fmt.num(a.present)} sub={`${a.half} half days`} />
          <Kpi icon="bi-x-circle" tone={2} label="Days absent" value={fmt.num(a.absent)} />
          <Kpi icon="bi-stopwatch" tone={3} label="Avg hours / day" value={fmt.hours(a.avgHours)} />
          <Kpi icon="bi-alarm" tone={4} label="Avg check-in" value={clock(a.avgCheckIn)} />
        </div>
        <div className="rp-grid">
          <ChartCard span={4} icon="bi-pie-chart" title="Status mix"><DonutChart data={a.byStatus} centerLabel="Days" /></ChartCard>
          <ChartCard span={8} icon="bi-stopwatch" title="Hours worked per day" subtitle="Monthly average">
            <BarChart labels={L} series={[{ name: 'Hours', values: a.hoursTrend, color: 'var(--ch-1)' }]} height={240} />
          </ChartCard>
          <ChartCard span={6} icon="bi-calendar-week" title="Hours by weekday" subtitle="Average hours worked">
            <BarChart labels={WEEKDAYS} series={[{ name: 'Hours', values: a.weekdayHours, color: 'var(--ch-4)' }]} height={230} />
          </ChartCard>
          <ChartCard span={6} icon="bi-alarm" title="Check-in time" subtitle="Average arrival time by month">
            <LineChart labels={L} format={clock} yMin={yMin} yMax={yMax} series={[{ name: 'Check-in', values: a.checkInTrend, color: 'var(--ch-3)' }]} height={230} />
          </ChartCard>
          <ChartCard span={12} icon="bi-bar-chart" title="Days present per month">
            <BarChart labels={L} integer series={[{ name: 'Present', values: a.presentTrend, color: 'var(--st-ok)' }]} height={230} />
          </ChartCard>
        </div>
      </>
    );
  };

  /* ─── Leave ─── */
  const leave = () => {
    if (!ready) return <Skeleton />;
    const l = m.leave;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-umbrella-fill" tone={1} label="Leave quota" value={`${l.quota} days`} sub="per year" />
          <Kpi icon="bi-calendar2-check" tone={2} label="Used this year" value={`${l.used} days`} />
          <Kpi icon="bi-hourglass-split" tone={3} label="Remaining" value={`${l.remaining} days`} />
          <Kpi icon="bi-send" tone={4} label="Awaiting approval" value={fmt.num(l.pending)} />
        </div>
        <div className="rp-grid">
          <ChartCard span={4} icon="bi-bullseye" title="Leave balance">
            <RingGauge percent={l.usedPct} label={`${l.remaining} days left`} sub={`${l.used} of ${l.quota} used`} color="var(--ch-1)" size={150} />
          </ChartCard>
          <ChartCard span={8} icon="bi-bar-chart-steps" title="Leave days by month" subtitle="Stacked by request status">
            <BarChart stacked labels={L} integer series={l.monthly} height={240} />
          </ChartCard>
          <ChartCard span={4} icon="bi-pie-chart" title="Approved leave by type" subtitle="Days"><DonutChart data={l.byType} centerLabel="Days" /></ChartCard>
          <ChartCard span={4} icon="bi-activity" title="Request outcomes"><DonutChart data={l.byStatus} centerLabel="Requests" /></ChartCard>
          <ChartCard span={4} icon="bi-calendar-event" title="Upcoming leave">
            <DeadlineList items={l.upcoming.map((u) => ({ ...u, overdue: false }))} empty="No upcoming leave" />
          </ChartCard>
        </div>
      </>
    );
  };

  /* ─── Payroll ─── */
  const payroll = () => {
    if (!ready) return <Skeleton />;
    const p = m.payroll;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-receipt" tone={1} label="Payslips" value={fmt.num(p.slips)} sub={`${p.paid} paid`} />
          <Kpi icon="bi-cash-stack" tone={2} label="Latest net pay" value={p.latest != null ? fmt.money(p.latest) : '—'} />
          <Kpi icon="bi-graph-up-arrow" tone={3} label="Average net pay" value={p.avgNet != null ? fmt.money(p.avgNet) : '—'} />
          <Kpi icon="bi-calendar-range" tone={4} label="This year so far" value={p.ytd ? fmt.money(p.ytd) : '—'} />
        </div>
        <div className="rp-grid">
          {p.hasSalary ? (
            <>
              <ChartCard span={8} icon="bi-graph-up" title="Net pay trend" subtitle="Month by month">
                <LineChart area labels={L} format={fmt.money} yMin={tightMin(p.net)} series={[{ name: 'Net pay', values: p.net, color: 'var(--ch-1)' }]} height={250} />
              </ChartCard>
              <ChartCard span={4} icon="bi-pie-chart" title="Payslip status"><DonutChart data={p.byStatus} centerLabel="Payslips" /></ChartCard>
              <ChartCard span={12} icon="bi-bar-chart-steps" title="Earnings vs deductions" subtitle="Basic + allowances compared with deductions">
                <BarChart labels={L} format={fmt.money} series={[{ name: 'Basic + allowances', values: p.basic, color: 'var(--ch-1)' }, { name: 'Deductions', values: p.ded, color: 'var(--ch-6)' }]} height={240} />
              </ChartCard>
            </>
          ) : (
            <>
              <ChartCard span={4} icon="bi-pie-chart" title="Payslip status"><DonutChart data={p.byStatus} centerLabel="Payslips" /></ChartCard>
              <ChartCard span={8} icon="bi-info-circle" title="Salary charts">
                <Empty icon="bi-cash-stack" text="Pay trends appear here once your payslips include amounts." />
              </ChartCard>
            </>
          )}
        </div>
      </>
    );
  };

  /* ─── Work: projects + help desk ─── */
  const work = () => {
    if (!ready) return <Skeleton />;
    const p = m.projects, h = m.help;
    return (
      <>
        <div className="rp-kpis">
          <Kpi icon="bi-kanban-fill" tone={1} label="Active projects" value={fmt.num(p.active)} sub={`${p.total} assigned in total`} />
          <Kpi icon="bi-check-circle-fill" tone={2} label="Completed" value={fmt.num(p.completed)} />
          <Kpi icon="bi-alarm-fill" tone={3} label="Past deadline" value={fmt.num(p.overdue)} />
          <Kpi icon="bi-headset" tone={4} label="Open help requests" value={fmt.num(h.open)} sub={`${h.resolved} resolved`} />
        </div>
        <div className="rp-grid">
          <ChartCard span={4} icon="bi-kanban" title="Projects by status"><DonutChart data={p.byStatus} centerLabel="Projects" /></ChartCard>
          <ChartCard span={4} icon="bi-flag" title="Projects by priority"><DonutChart data={p.byPriority} centerLabel="Projects" /></ChartCard>
          <ChartCard span={4} icon="bi-calendar-event" title="Upcoming deadlines"><DeadlineList items={p.deadlines} empty="No open deadlines" /></ChartCard>
          <ChartCard span={6} icon="bi-graph-up" title="Help requests raised" subtitle="Per month">
            <BarChart labels={L} integer series={[{ name: 'Requests', values: h.raised, color: 'var(--ch-4)' }]} height={230} />
          </ChartCard>
          <ChartCard span={3} icon="bi-activity" title="Request status"><DonutChart data={h.byStatus} centerLabel="Requests" /></ChartCard>
          <ChartCard span={3} icon="bi-tags" title="Request types"><HBars data={h.byType.map((t) => ({ label: t.label, value: t.value, color: t.color }))} /></ChartCard>
        </div>
      </>
    );
  };

  const tabs = [
    { id: 'overview',   label: 'Overview',   icon: 'bi-speedometer2',   render: overview },
    { id: 'attendance', label: 'Attendance', icon: 'bi-calendar-check', render: attendance },
    { id: 'leave',      label: 'Leave',      icon: 'bi-umbrella',       render: leave },
    { id: 'payroll',    label: 'Payroll',    icon: 'bi-wallet2',        render: payroll },
    { id: 'work',       label: 'Projects & Help', icon: 'bi-kanban',    render: work },
  ];

  const name = raw?.profile ? `${raw.profile.firstName || ''} ${raw.profile.lastName || ''}`.trim() : '';
  return (
    <ReportShell
      title="My Reports" icon="bi-graph-up-arrow"
      subtitle={`${name ? `${name} · ` : ''}your personal activity over the last ${range} months`}
      tabs={tabs} ranges={RANGES} range={range} onRange={setRange}
      onRefresh={load} loading={loading} updatedAt={updatedAt} failed={failed.map(pretty)}
    />
  );
}
