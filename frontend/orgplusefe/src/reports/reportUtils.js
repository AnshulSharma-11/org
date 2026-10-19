import authFetch from '../config/authFetch';

/* ───────── Fetching ─────────
   Backend pages are capped at 200 rows, so we walk every page.
   Endpoints that return a plain array (payroll, projects) work too. */
export async function fetchAll(url, { size = 200, maxPages = 25 } = {}) {
  const sep = url.includes('?') ? '&' : '?';
  const get = async (page) => {
    const res = await authFetch(`${url}${sep}page=${page}&size=${size}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  const first = await get(0);
  const d = first.data;
  if (Array.isArray(d)) return d;
  if (!d || !Array.isArray(d.content)) return [];
  const items = [...d.content];
  const pages = Math.min(d.totalPages || 1, maxPages);
  if (pages > 1) {
    const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => get(i + 1).then((j) => j.data?.content ?? [])));
    rest.forEach((r) => items.push(...r));
  }
  return items;
}

export async function fetchObject(url) {
  const res = await authFetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).data ?? null;
}

/** Runs named loaders in parallel; one failing endpoint never breaks the page. */
export async function loadAll(loaders) {
  const names = Object.keys(loaders);
  const settled = await Promise.allSettled(names.map((n) => loaders[n]()));
  const data = {}, failed = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') data[names[i]] = r.value;
    else { data[names[i]] = Array.isArray(r.value) ? [] : null; failed.push(names[i]); }
  });
  return { data, failed };
}

/* ───────── Dates ───────── */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function parseDate(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
export const ymKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const dayKey = (d) => `${ymKey(d)}-${String(d.getDate()).padStart(2, '0')}`;

/** The last n calendar months, oldest first. */
export function lastMonths(n, now = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const first = out.length === 0 || d.getMonth() === 0;
    out.push({
      key: ymKey(d), date: d,
      label: MONTHS[d.getMonth()] + (first ? ` ’${String(d.getFullYear()).slice(2)}` : ''),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    });
  }
  return out;
}
export const inRange = (d, from) => d && d >= from;
export const hourOf = (s) => { const m = /T(\d{2}):(\d{2})/.exec(s || ''); return m ? +m[1] + +m[2] / 60 : null; };
export const diffHours = (a, b) => { const x = new Date(a), y = new Date(b); const h = (y - x) / 36e5; return Number.isFinite(h) && h >= 0 ? h : null; };
export const fmtDate = (d) => (d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/* ───────── Grouping ───────── */
export function countBy(items, fn) {
  const m = new Map();
  items.forEach((it) => { const k = fn(it); if (k != null) m.set(k, (m.get(k) || 0) + 1); });
  return m;
}
export function sumBy(items, fn, val) {
  const m = new Map();
  items.forEach((it) => { const k = fn(it); const v = val(it); if (k != null && v != null) m.set(k, (m.get(k) || 0) + v); });
  return m;
}
export function avgBy(items, fn, val) {
  const s = new Map();
  items.forEach((it) => {
    const k = fn(it), v = val(it);
    if (k == null || v == null) return;
    const e = s.get(k) || { t: 0, n: 0 }; e.t += v; e.n += 1; s.set(k, e);
  });
  return new Map([...s].map(([k, e]) => [k, e.t / e.n]));
}
/** Map → [{label,value}] sorted high→low, keeping top n (rest folded into "Other"). */
export function ranked(map, { top = 8, other = false, label = (k) => k } = {}) {
  const all = [...map].map(([k, v]) => ({ key: k, label: label(k), value: v })).sort((a, b) => b.value - a.value);
  if (all.length <= top) return all;
  const head = all.slice(0, top);
  if (other) head.push({ key: '__other', label: 'Other', value: all.slice(top).reduce((a, x) => a + x.value, 0) });
  return head;
}
export const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
export const sum = (arr) => arr.reduce((a, b) => a + (b || 0), 0);
export const pct = (a, b) => (b ? (a / b) * 100 : 0);

/* ───────── Labels & colours ───────── */
export const pretty = (s) => (s == null || s === '' ? 'Not specified'
  : String(s).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()));
export const empName = (e) => (e ? `${e.firstName || ''} ${e.lastName || ''}`.trim() || `#${e.id}` : 'Unknown');

const STATUS_COLOR = {
  ACTIVE: 'var(--st-ok)', APPROVED: 'var(--st-ok)', PAID: 'var(--st-ok)', PRESENT: 'var(--st-ok)', COMPLETED: 'var(--st-ok)', RESOLVED: 'var(--st-ok)', LOW: 'var(--st-ok)', SUBMITTED: 'var(--st-ok)',
  PENDING: 'var(--st-warn)', INACTIVE: 'var(--st-warn)', HALF_DAY: 'var(--st-warn)', MEDIUM: 'var(--st-warn)', DRAFT: 'var(--st-warn)',
  HIGH: 'var(--st-high)',
  REJECTED: 'var(--st-bad)', ABSENT: 'var(--st-bad)', TERMINATED: 'var(--st-bad)', CRITICAL: 'var(--st-bad)', URGENT: 'var(--st-bad)',
  OPEN: 'var(--st-info)', PROCESSED: 'var(--st-info)', ON_LEAVE: 'var(--st-info)',
  IN_PROGRESS: 'var(--ch-1)',
  CLOSED: 'var(--st-neutral)', CANCELLED: 'var(--st-neutral)', ON_HOLD: 'var(--st-neutral)',
};
export const statusColor = (k, i = 0) => STATUS_COLOR[String(k).toUpperCase()] || `var(--ch-${(i % 8) + 1})`;
export const toSlices = (map, order = []) => {
  const keys = [...map.keys()].sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return map.get(b) - map.get(a);
  });
  return keys.map((k, i) => ({ label: pretty(k), value: map.get(k), color: statusColor(k, i), key: k }));
};

/* ───────── Payslip amounts (payslipData is free-form JSON) ───────── */
const toNum = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') { const n = parseFloat(v.replace(/[^0-9.\-]/g, '')); return Number.isNaN(n) ? null : n; }
  return null;
};
export function payslipAmounts(raw) {
  if (!raw) return null;
  let o;
  try { o = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const r = { net: null, gross: null, basic: null, hra: null, deductions: null };
  Object.entries(o).forEach(([k, v]) => {
    const key = k.toLowerCase().replace(/[^a-z]/g, ''); const n = toNum(v);
    if (n == null) return;
    if (/net|takehome|inhand/.test(key)) r.net ??= n;
    else if (/gross|ctc/.test(key)) r.gross ??= n;
    else if (/basic/.test(key)) r.basic ??= n;
    else if (/hra|houserent/.test(key)) r.hra ??= n;
    else if (/deduct/.test(key)) r.deductions ??= n;
  });
  if (r.net == null) {
    if (r.gross != null) r.net = r.gross - (r.deductions || 0);
    else if (r.basic != null) r.net = r.basic + (r.hra || 0) - (r.deductions || 0);
  }
  return Object.values(r).some((v) => v != null) ? r : null;
}
