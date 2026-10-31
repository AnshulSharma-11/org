import authFetch from '../../config/authFetch';
import { ADMIN_BASE } from '../../config/apiConfig';

/**
 * Download attendance as CSV.
 * params: { dateFrom, dateTo, status, departmentId, employeeId } — all optional
 * (with no dates the server exports today).
 */
export async function downloadAttendanceCsv(params = {}) {
  let qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.append(k, v); });

  let res = await authFetch(`${ADMIN_BASE}/attendance/export?${qs.toString()}`);
  if (!res.ok) {
    let msg = 'Export failed';
    try { msg = (await res.json()).message || msg; } catch { /* keep default */ }
    throw new Error(msg);
  }
  let blob = await res.blob();
  let cd = res.headers.get('Content-Disposition') || '';
  let m = /filename="?([^";]+)"?/.exec(cd);
  let name = m ? m[1] : 'attendance.csv';

  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
