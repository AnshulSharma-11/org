import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_BASE } from '../../config/apiConfig';

export default function AdminDashboard() {
  let [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        let [employees, departments, branches, payrolls] = await Promise.all([
          authFetch(`${ADMIN_BASE}/employees`).then(r => r.json()),
          authFetch(`${ADMIN_BASE}/departments`).then(r => r.json()),
          authFetch(`${ADMIN_BASE}/branches`).then(r => r.json()),
          authFetch(`${ADMIN_BASE}/payroll`).then(r => r.json()),
        ]);
        setStats({
          employees:   employees.data?.totalElements   ?? 0,
          departments: departments.data?.totalElements ?? 0,
          branches:    branches.data?.totalElements    ?? 0,
          payrolls:    Array.isArray(payrolls.data) ? payrolls.data.length : 0,
        });
      } catch {
        setStats({ employees:0, departments:0, branches:0, payrolls:0 });
      }
    }
    load();
  }, []);

  let loading = stats === null;

  let statCards = [
    { label:'Total Employees', value:stats?.employees,   icon:'bi-people-fill',    bg:'var(--primary-soft)', color:'var(--primary-soft-fg)' },
    { label:'Departments',     value:stats?.departments, icon:'bi-building-fill',  bg:'var(--tone2-bg)', color:'var(--tone2-fg)' },
    { label:'Branches',        value:stats?.branches,    icon:'bi-diagram-3-fill', bg:'var(--tone3-bg)', color:'var(--tone3-fg)' },
    { label:'Payroll Runs',    value:stats?.payrolls,    icon:'bi-wallet2',        bg:'var(--tone4-bg)', color:'var(--tone4-fg)' },
  ];

  let quickCards = [
    { label:'Employees',    icon:'bi-people',         cls:'qc-blue',   to:'/admin/employees' },
    { label:'Departments',  icon:'bi-building',       cls:'qc-green',  to:'/admin/departments' },
    { label:'Branches',     icon:'bi-diagram-3',      cls:'qc-yellow', to:'/admin/branches' },
    { label:'Payroll',      icon:'bi-wallet2',        cls:'qc-green',  to:'/admin/payroll' },
    { label:'Designations', icon:'bi-award',          cls:'qc-purple', to:'/admin/designations' },
    { label:'Attendance',   icon:'bi-clock',          cls:'qc-orange', to:'/admin/time-records' },
    { label:'Leave',        icon:'bi-umbrella',       cls:'qc-teal',   to:'/admin/leaves' },
    { label:'Performance',  icon:'bi-graph-up-arrow', cls:'qc-pink',   to:'/admin/performance' },
    { label:'Help Desk',    icon:'bi-headphones',     cls:'qc-indigo', to:'/admin/help' },
    { label:'Payroll Run',  icon:'bi-calendar-check', cls:'qc-lime',   to:'/admin/payroll/add' },
    { label:'Reports',      icon:'bi-graph-up-arrow', cls:'qc-blue',   to:'/admin/reports' },
  ];

  return (
    <div className="hrms-content">
      <div className="page-header">
        <h4><i className="bi bi-grid"></i> Dashboard</h4>
        <span style={{ fontSize:'0.85rem', color:'var(--muted)' }}>
          {new Date().toLocaleDateString('en-IN',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </span>
      </div>

      <div className="row g-3 mb-4">
        {loading
          ? Array.from({ length:4 }).map((_,i) => (
              <div className="col-sm-6 col-xl-3" key={i}>
                <div className="stat-card" style={{ minHeight:88 }}>
                  <div style={{ width:50, height:50, borderRadius:12, background:'var(--border)' }} />
                  <div style={{ flex:1 }}><div style={{ height:28, background:'var(--border)', borderRadius:6, marginBottom:8 }} /><div style={{ height:14, background:'var(--border)', borderRadius:6, width:'60%' }} /></div>
                </div>
              </div>
            ))
          : statCards.map((card,i) => (
              <div className="col-sm-6 col-xl-3" key={i}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background:card.bg, color:card.color }}><i className={`bi ${card.icon}`}></i></div>
                  <div><div className="stat-value">{card.value}</div><div className="stat-label">{card.label}</div></div>
                </div>
              </div>
            ))}
      </div>

      <div className="section-title"><i className="bi bi-lightning-charge"></i> Quick Access</div>
      <div className="quick-grid">
        {quickCards.map((card,i) => (
          <Link key={i} to={card.to} className={`quick-card ${card.cls}`}>
            <i className={`bi ${card.icon}`}></i><span>{card.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
