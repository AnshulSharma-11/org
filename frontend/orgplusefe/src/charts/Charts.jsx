import React, { useEffect, useRef, useState } from 'react';
import './charts.css';

/* ═══════════════════════════════════════════════════════════
   Lightweight, dependency-free SVG charts.
   Every colour is a CSS variable from theme.css, so all graphs
   follow light / dark mode and the logo palette automatically.
   ═══════════════════════════════════════════════════════════ */

export const PALETTE = [
  'var(--ch-1)', 'var(--ch-2)', 'var(--ch-3)', 'var(--ch-4)',
  'var(--ch-5)', 'var(--ch-6)', 'var(--ch-7)', 'var(--ch-8)',
];
export const pick = (i) => PALETTE[i % PALETTE.length];

const nf  = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });
// Indian short notation: 12k · 1.5L (lakh) · 3.2Cr (crore)
const short = (v) => {
  const a = Math.abs(v), s = v < 0 ? '-' : '';
  const t = (x) => String(+x.toFixed(1));
  if (a >= 1e7) return `${s}${t(a / 1e7)}Cr`;
  if (a >= 1e5) return `${s}${t(a / 1e5)}L`;
  if (a >= 1e3) return `${s}${t(a / 1e3)}k`;
  return `${s}${t(a)}`;
};
export const fmt = {
  num:     (v) => (v == null || Number.isNaN(v) ? '—' : nf.format(v)),
  compact: (v) => (v == null || Number.isNaN(v) ? '—' : short(v)),
  money:   (v) => (v == null || Number.isNaN(v) ? '—' : '₹' + short(v)),
  pct:     (v) => (v == null || Number.isNaN(v) ? '—' : `${Math.round(v)}%`),
  hours:   (v) => (v == null || Number.isNaN(v) ? '—' : `${nf.format(v)} h`),
};

/* ── helpers ─────────────────────────────────────────────── */
function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setW(Math.round(el.getBoundingClientRect().width));
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** A sensible non-zero axis start for trend lines, so small changes stay visible. */
export function tightMin(values) {
  const v = values.filter((x) => x != null && Number.isFinite(x));
  if (v.length < 2) return 0;
  const lo = Math.min(...v), hi = Math.max(...v);
  const pad = (hi - lo) || Math.abs(hi) * 0.1 || 1;
  const raw = lo - pad;
  if (raw <= 0) return 0;
  const step = 10 ** Math.floor(Math.log10(raw));
  return Math.max(0, Math.floor(raw / step) * step);
}

function niceScale(maxVal, integer = false, count = 4) {
  if (!(maxVal > 0)) return { max: 1, ticks: [0, 1] };
  const rough = maxVal / count;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const n = rough / pow;
  let step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
  if (integer) step = Math.max(1, Math.ceil(step));
  const max = Math.ceil(maxVal / step - 1e-9) * step;
  const ticks = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(6));
  return { max, ticks };
}

const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));

function Tip({ x, y, width, title, rows }) {
  // keep the tooltip inside the chart horizontally
  const half = 70;
  const left = Math.max(half, Math.min(width - half, x));
  return (
    <div className="ch-tip" style={{ left, top: y }}>
      {title != null && <b>{title}</b>}
      {rows.map((r, i) => (
        <div className="row" key={i}>
          <span><i className="dot" style={{ background: r.color }} />{r.name}</span>
          <strong>{r.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }) {
  if (!items || items.length < 2) return null;
  return (
    <div className="ch-legend">
      {items.map((it, i) => (
        <span key={i}><i className="dot" style={{ background: it.color }} />{it.name}</span>
      ))}
    </div>
  );
}

export function Empty({ text = 'No data to show yet', icon = 'bi-bar-chart-line' }) {
  return <div className="rp-empty"><i className={`bi ${icon}`} /><span>{text}</span></div>;
}

/* ═════════ BarChart (grouped or stacked) ═════════
   labels : ['Jan','Feb', ...]
   series : [{ name, color?, values: [..] }]                      */
export function BarChart({
  labels, series, stacked = false, height = 260, format = fmt.num, integer = false, label = 'Bar chart',
}) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  const n = labels.length;
  const has = series.some((s) => s.values.some((v) => v > 0));
  if (!n || !has) return <Empty />;

  const cols = series.map((s, i) => ({ ...s, color: s.color || pick(i) }));
  const totals = labels.map((_, i) => (stacked
    ? cols.reduce((a, s) => a + (s.values[i] || 0), 0)
    : Math.max(...cols.map((s) => s.values[i] || 0))));
  const { max, ticks } = niceScale(Math.max(...totals, 0), integer);
  const left = Math.max(...ticks.map((t) => String(format(t)).length)) * 6.6 + 12;
  const m = { t: 10, r: 6, b: 28, l: left };
  const W = Math.max(w, 160), H = height;
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const band = iw / n;
  const group = Math.min(band * 0.72, stacked ? 46 : 22 * cols.length + 8);
  const barW = stacked ? group : group / cols.length;
  const y = (v) => m.t + ih * (1 - v / max);
  const maxLab = Math.max(...labels.map((l) => String(l).length));
  const step = Math.max(1, Math.ceil((maxLab * 6.2 + 8) / band));

  return (
    <div className="ch-wrap" ref={ref}>
      {w > 0 && (
        <svg className="ch-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
          <g className="ch-grid ch-axis">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} />
                <text x={m.l - 8} y={y(t) + 4} textAnchor="end">{format(t)}</text>
              </g>
            ))}
          </g>
          {labels.map((lb, i) => {
            const x0 = m.l + i * band + (band - group) / 2;
            let acc = 0;
            return (
              <g key={i} opacity={hover == null || hover === i ? 1 : 0.45}>
                {cols.map((s, k) => {
                  const v = s.values[i] || 0;
                  if (v <= 0) return null;
                  const h = ih * (v / max);
                  const yy = stacked ? y(acc + v) : m.t + ih - h;
                  const xx = stacked ? x0 : x0 + k * barW;
                  acc += v;
                  return (
                    <rect key={k} className="ch-bar" x={xx + (stacked ? 0 : 1)} y={yy}
                      width={Math.max(2, barW - (stacked ? 0 : 2))} height={Math.max(1, h)} rx="3"
                      style={{ fill: s.color, animationDelay: `${i * 25}ms` }} />
                  );
                })}
                {i % step === 0 && (
                  <text className="ch-axis-x" x={m.l + (i + 0.5) * band} y={H - 9} textAnchor="middle">{clip(lb, 11)}</text>
                )}
                <rect className="ch-hit" x={m.l + i * band} y={m.t} width={band} height={ih}
                  onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
              </g>
            );
          })}
          <g className="ch-axis-x ch-zero ch-grid"><line x1={m.l} x2={W - m.r} y1={m.t + ih} y2={m.t + ih} /></g>
        </svg>
      )}
      {hover != null && w > 0 && (
        <Tip x={m.l + (hover + 0.5) * band} y={m.t + 4} width={W} title={labels[hover]}
          rows={cols.map((s) => ({ name: s.name, color: s.color, value: format(s.values[hover] || 0) }))
            .filter((r) => cols.length === 1 || r.value !== '0')} />
      )}
      <Legend items={cols.map((s) => ({ name: s.name, color: s.color }))} />
    </div>
  );
}

/* ═════════ LineChart (optionally filled) ═════════ */
export function LineChart({
  labels, series, area = false, height = 260, format = fmt.num, integer = false, yMax, yMin = 0, label = 'Line chart',
}) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  const n = labels.length;
  const has = series.some((s) => s.values.some((v) => v != null && v !== 0));
  if (!n || !has) return <Empty icon="bi-graph-up" />;

  const cols = series.map((s, i) => ({ ...s, color: s.color || pick(i) }));
  const all = cols.flatMap((s) => s.values.filter((v) => v != null));
  const sc = niceScale((yMax ?? Math.max(...all, 0)) - yMin, integer);
  const ticks = sc.ticks.map((t) => +(t + yMin).toFixed(6));
  const max = sc.max + yMin;
  const left = Math.max(...ticks.map((t) => String(format(t)).length)) * 6.6 + 12;
  const m = { t: 12, r: 14, b: 28, l: left };
  const W = Math.max(w, 160), H = height;
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const band = iw / n;
  const X = (i) => m.l + (i + 0.5) * band;
  const Y = (v) => m.t + ih * (1 - (v - yMin) / (max - yMin));
  const maxLab = Math.max(...labels.map((l) => String(l).length));
  const step = Math.max(1, Math.ceil((maxLab * 6.2 + 10) / band));

  const path = (vals) => {
    let d = '', pen = false;
    vals.forEach((v, i) => {
      if (v == null) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  };

  return (
    <div className="ch-wrap" ref={ref}>
      {w > 0 && (
        <svg className="ch-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
          <g className="ch-grid ch-axis">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={m.l} x2={W - m.r} y1={Y(t)} y2={Y(t)} />
                <text x={m.l - 8} y={Y(t) + 4} textAnchor="end">{format(t)}</text>
              </g>
            ))}
          </g>
          {cols.map((s, k) => {
            const d = path(s.values);
            const firstI = s.values.findIndex((v) => v != null);
            let lastI = -1;
            s.values.forEach((v, i) => { if (v != null) lastI = i; });
            return (
              <g key={k}>
                {area && d && (
                  <path className="ch-area" d={`${d} L${X(lastI)},${m.t + ih} L${X(firstI)},${m.t + ih} Z`} style={{ fill: s.color }} />
                )}
                <path className="ch-line" d={d} style={{ stroke: s.color }} pathLength="2000" />
                {s.values.map((v, i) => v == null ? null : (
                  <circle key={i} cx={X(i)} cy={Y(v)} r={hover === i ? 5 : n > 24 ? 0 : 3}
                    style={{ fill: 'var(--surface)', stroke: s.color, strokeWidth: 2 }} />
                ))}
              </g>
            );
          })}
          {hover != null && <line x1={X(hover)} x2={X(hover)} y1={m.t} y2={m.t + ih} style={{ stroke: 'var(--border-strong)', strokeDasharray: '3 3' }} />}
          {labels.map((lb, i) => (
            <g key={i}>
              {i % step === 0 && <text className="ch-axis-x" x={X(i)} y={H - 9} textAnchor="middle">{clip(lb, 10)}</text>}
              <rect className="ch-hit" x={m.l + i * band} y={m.t} width={band} height={ih}
                onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
            </g>
          ))}
        </svg>
      )}
      {hover != null && w > 0 && (
        <Tip x={X(hover)} y={m.t + 2} width={W} title={labels[hover]}
          rows={cols.map((s) => ({ name: s.name, color: s.color, value: s.values[hover] == null ? '—' : format(s.values[hover]) }))} />
      )}
      <Legend items={cols.map((s) => ({ name: s.name, color: s.color }))} />
    </div>
  );
}

/* ═════════ DonutChart ═════════
   data : [{ label, value, color? }]                              */
export function DonutChart({ data, centerLabel = 'Total', format = fmt.num, label = 'Donut chart' }) {
  const [active, setActive] = useState(null);
  const rows = data.filter((d) => d.value > 0).map((d, i) => ({ ...d, color: d.color || pick(i) }));
  const total = rows.reduce((a, d) => a + d.value, 0);
  if (!total) return <Empty icon="bi-pie-chart" />;

  const R = 64, SW = 24, C = 2 * Math.PI * R;
  let acc = 0;
  const a = active != null ? rows[active] : null;
  return (
    <div className="ch-donut">
      <svg viewBox="0 0 170 170" role="img" aria-label={label} onMouseLeave={() => setActive(null)}>
        <circle cx="85" cy="85" r={R} fill="none" strokeWidth={SW} style={{ stroke: 'var(--surface-3)' }} />
        <g transform="rotate(-90 85 85)">
          {rows.map((d, i) => {
            const len = (d.value / total) * C;
            const gap = rows.length > 1 ? Math.min(2.5, len * 0.4) : 0;
            const off = -acc;
            acc += len;
            return (
              <circle key={i} className="seg" cx="85" cy="85" r={R} fill="none"
                strokeWidth={active === i ? SW + 4 : SW}
                strokeDasharray={`${Math.max(0, len - gap)} ${C - Math.max(0, len - gap)}`} strokeDashoffset={off}
                style={{ stroke: d.color, opacity: active == null || active === i ? 1 : 0.4 }}
                onMouseEnter={() => setActive(i)} onClick={() => setActive(active === i ? null : i)} />
            );
          })}
        </g>
        <text className="center-v" x="85" y="88" textAnchor="middle">{format(a ? a.value : total)}</text>
        <text className="center-l" x="85" y="106" textAnchor="middle">{clip(a ? a.label : centerLabel, 16)}</text>
      </svg>
      <div className="ch-dlegend">
        {rows.map((d, i) => (
          <div key={i} className={`it ${active === i ? 'on' : ''}`} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
            <i className="dot" style={{ background: d.color }} />
            <span className="nm" title={d.label}>{d.label}</span>
            <span className="vl">{format(d.value)}</span>
            <span className="pc">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════ HBars — ranked horizontal bars ═════════
   data : [{ label, value, color? }]                              */
export function HBars({ data, format = fmt.num, color, max }) {
  const rows = data.filter((d) => d.value != null);
  if (!rows.length) return <Empty icon="bi-list-ol" />;
  const top = max ?? Math.max(...rows.map((d) => d.value), 1);
  return (
    <div className="ch-hbars">
      {rows.map((d, i) => (
        <div className="ch-hrow" key={i}>
          <span className="lb" title={d.label}>{d.label}</span>
          <div className="tr">
            <div className="fl" style={{ width: `${Math.max(2, (d.value / top) * 100)}%`, background: d.color || color || pick(0), animationDelay: `${i * 40}ms` }} />
          </div>
          <span className="vl">{format(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ═════════ RingGauge ═════════ */
export function RingGauge({ percent, label, sub, color = 'var(--ch-1)', size = 132 }) {
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const R = 52, C = 2 * Math.PI * R;
  return (
    <div className="ch-ring">
      <svg width={size} height={size} viewBox="0 0 132 132" role="img" aria-label={`${label}: ${Math.round(p)}%`}>
        <circle className="track" cx="66" cy="66" r={R} fill="none" strokeWidth="13" />
        {p > 0 && (
          <circle className="val" cx="66" cy="66" r={R} fill="none" strokeWidth="13" strokeLinecap="round"
            transform="rotate(-90 66 66)" strokeDasharray={`${(p / 100) * C} ${C}`} style={{ stroke: color }} />
        )}
        <text className="rv" x="66" y="75" textAnchor="middle">{Math.round(p)}%</text>
      </svg>
      <div>
        <div className="rl">{label}</div>
        {sub && <div className="rs">{sub}</div>}
      </div>
    </div>
  );
}

/* ═════════ CalendarHeatmap — one cell per day ═════════
   days : { 'YYYY-MM-DD': { status, hours } }                      */
const CAL_COLORS = {
  PRESENT: 'var(--st-ok)', HALF_DAY: 'var(--st-warn)', ABSENT: 'var(--st-bad)', ON_LEAVE: 'var(--st-info)',
};
export const CAL_LEGEND = [
  { name: 'Present', color: CAL_COLORS.PRESENT }, { name: 'Half day', color: CAL_COLORS.HALF_DAY },
  { name: 'Absent', color: CAL_COLORS.ABSENT }, { name: 'On leave', color: CAL_COLORS.ON_LEAVE },
  { name: 'No record', color: 'var(--surface-3)' },
];
const pad2 = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export function CalendarHeatmap({ days, weeks = 26 }) {
  const wrap = useRef(null);
  const [fit, fitW] = useWidth();
  const [tip, setTip] = useState(null);
  const GAP = 3, LEFT = 30, TOP = 18;
  const CELL = Math.max(12, Math.min(24, Math.floor((fitW - LEFT) / weeks) - GAP));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7;                       // Monday = 0
  const start = new Date(today); start.setDate(today.getDate() - dow - (weeks - 1) * 7);
  const cells = [], months = [];
  let lastMonth = -1;
  for (let c = 0; c < weeks; c++) {
    for (let r = 0; r < 7; r++) {
      const d = new Date(start); d.setDate(start.getDate() + c * 7 + r);
      if (d > today) continue;
      if (r === 0 && d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        months.push({ c, label: d.toLocaleString('en', { month: 'short' }) });
      }
      cells.push({ c, r, d, rec: days[key(d)] });
    }
  }
  const W = LEFT + weeks * (CELL + GAP), H = TOP + 7 * (CELL + GAP);

  useEffect(() => { if (wrap.current) wrap.current.scrollLeft = wrap.current.scrollWidth; }, [weeks]);

  return (
    <div className="ch-wrap" ref={fit}>
      <div className="ch-cal" ref={wrap}>
        <svg width={W} height={H} style={{ display: 'block' }} role="img" aria-label="Attendance calendar" onMouseLeave={() => setTip(null)}>
          {['Mon', 'Wed', 'Fri'].map((t, i) => <text key={t} x="0" y={TOP + i * 2 * (CELL + GAP) + CELL - 2}>{t}</text>)}
          {months.map((mo, i) => <text key={i} x={LEFT + mo.c * (CELL + GAP)} y="11">{mo.label}</text>)}
          {cells.map((x, i) => (
            <rect key={i} className="cell" x={LEFT + x.c * (CELL + GAP)} y={TOP + x.r * (CELL + GAP)} width={CELL} height={CELL} rx="3"
              style={{ fill: x.rec ? (CAL_COLORS[x.rec.status] || 'var(--st-neutral)') : 'var(--surface-3)', opacity: x.rec ? 1 : x.r > 4 ? 0.45 : 0.8 }}
              onMouseEnter={() => setTip({ x: LEFT + x.c * (CELL + GAP) + CELL / 2 - (wrap.current?.scrollLeft || 0), y: TOP + x.r * (CELL + GAP), d: x.d, rec: x.rec })}
              onClick={() => setTip({ x: LEFT + x.c * (CELL + GAP) + CELL / 2 - (wrap.current?.scrollLeft || 0), y: TOP + x.r * (CELL + GAP), d: x.d, rec: x.rec })} />
          ))}
        </svg>
      </div>
      {tip && (
        <Tip x={tip.x} y={tip.y - 4} width={Math.max(wrap.current?.clientWidth || 300, 200)}
          title={tip.d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          rows={[{ name: tip.rec ? String(tip.rec.status).replace('_', ' ').toLowerCase() : 'no record', color: tip.rec ? (CAL_COLORS[tip.rec.status] || 'var(--st-neutral)') : 'var(--surface-3)',
            value: tip.rec && tip.rec.hours ? `${fmt.num(tip.rec.hours)} h` : '' }]} />
      )}
      <Legend items={CAL_LEGEND} />
    </div>
  );
}

/* ═════════ Layout helpers ═════════ */
export function ChartCard({ title, subtitle, icon, span = 6, children, className = '', right }) {
  return (
    <section className={`rp-card rp-span-${span} ${className}`}>
      <div className="rp-card-head">
        <div>
          <h3 className="rp-card-title">{icon && <i className={`bi ${icon}`} />}{title}</h3>
          {subtitle && <div className="rp-card-sub">{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="rp-card-body">{children}</div>
    </section>
  );
}

export function Kpi({ icon, label, value, sub, tone = 1 }) {
  return (
    <div className="rp-kpi">
      <div className="ico" style={{ background: `var(--tone${tone}-bg)`, color: `var(--tone${tone}-fg)` }}><i className={`bi ${icon}`} /></div>
      <div>
        <div className="val">{value}</div>
        <div className="lbl">{label}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
    </div>
  );
}
