import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { EMPLOYEE_BASE } from '../../config/apiConfig';

function StatusBadge({ value }) {
  let cls = value ? `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}` : '';
  return <span className={cls}>{value}</span>;
}

let MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function MyPayroll() {
  let { employeeId } = useParams();
  let [payrolls, setPayrolls] = useState(null);

  useEffect(() => {
    authFetch(`${EMPLOYEE_BASE(employeeId)}/payroll?sortDirection=desc`)
      .then(r => r.json())
      .then(obj => setPayrolls(obj.data ?? []))
      .catch(() => { setPayrolls([]); toast.error('Failed to load payroll'); });
  }, [employeeId]);

  if (payrolls === null) return (
    <div className="d-flex align-items-center gap-2 mt-4">
      <span className="spinner-border spinner-border-sm"></span> Loading...
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h4><i className="bi bi-wallet2"></i> My Payroll</h4>
      </div>

      {payrolls.length === 0 ? (
        <div className="hrms-card text-center text-muted py-5">
          <i className="bi bi-wallet2 fs-1 mb-3 d-block opacity-25"></i>
          No payroll records found.
        </div>
      ) : (
        <div className="row g-3">
          {payrolls.map(p => {
            let payslipRows = null;
            if (p.payslipData) {
              try {
                let parsed = JSON.parse(p.payslipData);
                payslipRows = Object.entries(parsed);
              } catch {
                payslipRows = null;
              }
            }

            return (
              <div className="col-md-6 col-xl-4" key={p.id}>
                <div className="hrms-card h-100">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="mb-0 fw-bold">
                      {MONTH_NAMES[p.month] || p.month} {p.year}
                    </h6>
                    <StatusBadge value={p.status} />
                  </div>

                  <div className="mb-2" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    <i className="bi bi-calendar3 me-1"></i>
                    Run Date: {p.runDate || '—'}
                  </div>

                  {payslipRows ? (
                    <table className="table table-sm mt-3 mb-0" style={{ fontSize: '0.83rem' }}>
                      <tbody>
                        {payslipRows.map(([key, val]) => (
                          <tr key={key}>
                            <td className="text-muted fw-semibold">{key}</td>
                            <td className="text-end">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : p.payslipData ? (
                    <pre style={{
                      fontSize: '0.78rem', background: '#f8fafc',
                      borderRadius: 8, padding: '10px', marginTop: 10, whiteSpace: 'pre-wrap',
                    }}>
                      {p.payslipData}
                    </pre>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
