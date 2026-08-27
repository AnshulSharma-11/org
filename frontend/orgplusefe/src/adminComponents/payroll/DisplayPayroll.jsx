import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

function StatusBadge({ value }) {
  let cls = value ? `status-badge badge-${String(value).toLowerCase().replace(/ /g, '_')}` : '';
  return <span className={cls}>{value}</span>;
}

let MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function DisplayPayroll({ payrollsValue, onDelete, onFilter, FilterBar }) {
  const { adminUser } = useAuth();

  const handlePayment = (payroll) => {
    if (!window.Razorpay) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    // Calculate amount in paise (Razorpay needs smallest currency unit)
    const salaryAmount = payroll.netSalary || payroll.grossSalary || payroll.amount || 0;
    const amountInPaise = Math.round(salaryAmount * 100);

    const employeeName = payroll.employee
      ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
      : 'Employee';

    const monthLabel = `${MONTH_NAMES[payroll.month] || payroll.month} ${payroll.year}`;

    const options = {
      key: "rzp_test_T5VyQJmuE0197k",           // ← replace with your Razorpay test key
      amount: amountInPaise,
      currency: "INR",
      name: "ORGpluse Payroll",
      description: `Salary for ${employeeName} — ${monthLabel}`,
      image: "",                        // optional: your logo URL
      prefill: {
        name: adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : '',
        email: adminUser?.email || '',
      },
      notes: {
        payroll_id: payroll.id,
        employee: employeeName,
        month_year: monthLabel,
      },
      theme: {
        color: "#1e293b",
      },
      handler: function (response) {
        // Payment successful on Razorpay side
        // Backend verify call removed — wire it up when backend is ready
        alert(`✅ Salary Paid Successfully!\nPayment ID: ${response.razorpay_payment_id}`);
        window.location.reload();
      },
      modal: {
        ondismiss: function () {
          // User closed the modal — do nothing, no error
        }
      }
    };

    const razor = new window.Razorpay(options);

    razor.on('payment.failed', function (response) {
      alert(`❌ Payment Failed: ${response.error.description}`);
    });

    razor.open();
  };

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-wallet2"></i> Payroll Runs</h4>
        <Link to="/admin/payroll/add" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1"></i> New Payroll Run
        </Link>
      </div>
      <FilterBar onFilter={onFilter} />
      <div className="hrms-card">
        <div className="table-responsive">
          <table className="table hrms-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Month / Year</th>
                <th>Run Date</th>
                <th>Status</th>
                <th>Processed By</th>
                <th>Actions</th>
                <th>Pay Salary</th>
              </tr>
            </thead>
            <tbody>
              {payrollsValue.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted py-4">No payroll records found.</td></tr>
              ) : (
                payrollsValue.map((p, idx) => (
                  <tr key={p.id}>
                    <td>{idx + 1}</td>
                    <td>
                      {p.employee
                        ? <><strong>{p.employee.firstName} {p.employee.lastName}</strong>
                            {p.employee.employeeCode && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{p.employee.employeeCode}</div>}
                          </>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td><strong>{MONTH_NAMES[p.month] || p.month} {p.year}</strong></td>
                    <td>{p.runDate || '—'}</td>
                    <td><StatusBadge value={p.status} /></td>
                    <td>{p.processedBy ? `${p.processedBy.firstName} ${p.processedBy.lastName}` : '—'}</td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => { if (window.confirm('Delete this payroll record?')) onDelete(p.id); }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-success"
                        onClick={() => handlePayment(p)}
                      >
                        Pay Salary
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
