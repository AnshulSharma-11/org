import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { EMPLOYEE_BASE } from '../../config/apiConfig';

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 0', borderBottom: '1px solid #f1f5f9',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: '#eff6ff', color: '#2563eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', flexShrink: 0,
      }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 500 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="hrms-card mb-4">
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 16, paddingBottom: 14,
        borderBottom: '2px solid #f1f5f9',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#2563eb', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.95rem',
        }}>
          <i className={`bi ${icon}`}></i>
        </div>
        <h6 style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
          {title}
        </h6>
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ value }) {
  let cls = value ? `status-badge badge-${String(value).toLowerCase()}` : '';
  return value ? <span className={cls}>{value}</span> : null;
}

export default function ViewProfile() {
  let { employeeId } = useParams();
  let [emp, setEmp] = useState(null);
  let [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${EMPLOYEE_BASE(employeeId)}/profile`)
      .then(r => r.json())
      .then(obj => setEmp(obj.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) return (
    <div className="d-flex align-items-center gap-2 mt-4">
      <span className="spinner-border spinner-border-sm"></span> Loading profile…
    </div>
  );

  if (!emp) return (
    <div className="hrms-card text-center text-muted py-5">
      <i className="bi bi-person-x fs-1 d-block mb-3 opacity-25"></i>
      Profile not found.
    </div>
  );

  let initials = `${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase();

  let tenureText = null;
  if (emp.hireDate) {
    let hire  = new Date(emp.hireDate);
    let until = emp.terminationDate ? new Date(emp.terminationDate) : new Date();
    let months = (until.getFullYear() - hire.getFullYear()) * 12
               + (until.getMonth() - hire.getMonth());
    let years  = Math.floor(months / 12);
    let rem    = months % 12;
    tenureText = years > 0
      ? `${years} yr${years !== 1 ? 's' : ''} ${rem > 0 ? `${rem} mo` : ''}`.trim()
      : `${rem} month${rem !== 1 ? 's' : ''}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h4><i className="bi bi-person-badge"></i> My Profile</h4>
        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
          Read-only — contact HR to update your details
        </span>
      </div>

      {/* Hero card */}
      <div className="profile-card mb-4">
        <div className="profile-avatar" style={{ fontSize: '2rem' }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="profile-name" style={{ fontSize: '1.4rem' }}>
            {emp.firstName} {emp.lastName}
            <span className="badge ms-2"
              style={{ background: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontWeight: 500 }}>
              {emp.employeeCode}
            </span>
          </div>
          <div className="profile-meta">
            {emp.designation?.title && (
              <span><i className="bi bi-award"></i> {emp.designation.title}</span>
            )}
            {emp.department?.name && (
              <span><i className="bi bi-building"></i> {emp.department.name}</span>
            )}
            {emp.branch?.name && (
              <span><i className="bi bi-diagram-3"></i> {emp.branch.name}</span>
            )}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatusBadge value={emp.status} />
            {tenureText && (
              <span style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: 20,
                padding: '2px 10px', fontSize: '0.78rem', fontWeight: 500,
              }}>
                <i className="bi bi-calendar3 me-1"></i>{tenureText} tenure
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Personal Information */}
        <div className="col-lg-6">
          <SectionCard title="Personal Information" icon="bi-person">
            <InfoRow icon="bi-person-fill"       label="Full Name"    value={`${emp.firstName} ${emp.lastName}`} />
            <InfoRow icon="bi-envelope-fill"     label="Email"        value={emp.email} />
            <InfoRow icon="bi-telephone-fill"    label="Phone"        value={emp.phone} />
            <InfoRow icon="bi-cake2-fill"        label="Date of Birth" value={emp.dob} />
            <InfoRow icon="bi-gender-ambiguous"  label="Gender"       value={emp.gender} />
            <InfoRow icon="bi-geo-alt-fill"      label="Address"      value={emp.address} />
          </SectionCard>
        </div>

        {/* Employment Details */}
        <div className="col-lg-6">
          <SectionCard title="Employment Details" icon="bi-briefcase">
            <InfoRow icon="bi-hash"              label="Employee Code"     value={emp.employeeCode} />
            <InfoRow icon="bi-calendar-check"    label="Hire Date"         value={emp.hireDate} />
            {emp.terminationDate && (
              <InfoRow icon="bi-calendar-x"      label="Termination Date"  value={emp.terminationDate} />
            )}
            <InfoRow icon="bi-award"             label="Designation"       value={emp.designation?.title} />
            <InfoRow icon="bi-building"          label="Department"        value={emp.department?.name} />
            <InfoRow icon="bi-diagram-3"         label="Branch"            value={emp.branch?.name} />
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 0',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: '#eff6ff', color: '#2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', flexShrink: 0,
              }}>
                <i className="bi bi-circle-fill"
                  style={{ fontSize: '0.6rem',
                    color: emp.status === 'ACTIVE' ? '#16a34a' : '#ef4444' }}
                ></i>
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  Status
                </div>
                <StatusBadge value={emp.status} />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Reporting Manager */}
        {emp.manager && (
          <div className="col-12">
            <SectionCard title="Reporting Manager" icon="bi-person-badge">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: '#dbeafe', color: '#1d4ed8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                }}>
                  {emp.manager.firstName?.[0]}{emp.manager.lastName?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                    {emp.manager.firstName} {emp.manager.lastName}
                  </div>
                  {emp.manager.employeeCode && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                      {emp.manager.employeeCode}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
