import React from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function UserNavbar() {
  let { employeeId } = useParams();
  let { logoutEmployee } = useAuth();
  let navigate = useNavigate();
  let base = `/employee/${employeeId}`;
  let linkClass = ({ isActive }) => isActive ? 'active' : '';

  function handleLogout() {
    logoutEmployee();
    navigate('/employee/login', { replace: true });
  }

  return (
    <nav className="user-navbar">
      <NavLink to={base} end className="brand">
        <i className="bi bi-people-circle"></i>
        ORGPLUSE Employee
      </NavLink>

      <div className="nav-links">
        <NavLink to={base} end className={linkClass}>
          <i className="bi bi-grid"></i> Dashboard
        </NavLink>
        <NavLink to={`${base}/profile`} className={linkClass}>
          <i className="bi bi-person-badge"></i> My Profile
        </NavLink>
        <NavLink to={`${base}/projects`} className={linkClass}>
          <i className="bi bi-kanban"></i> My Projects
        </NavLink>
        <NavLink to={`${base}/documents`} className={linkClass}>
          <i className="bi bi-folder2-open"></i> My Documents
        </NavLink>
        <NavLink to={`${base}/leaves`} className={linkClass}>
          <i className="bi bi-umbrella"></i> My Leaves
        </NavLink>
        <NavLink to={`${base}/help/raise`} className={linkClass}>
          <i className="bi bi-headphones"></i> Help
        </NavLink>
        <NavLink to={`${base}/payroll`} className={linkClass}>
          <i className="bi bi-wallet2"></i> Payroll
        </NavLink>
        <NavLink to={`${base}/attendance`} className={linkClass}>
          <i className="bi bi-clock"></i> Attendance
        </NavLink>
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#f87171', padding: '6px 12px', borderRadius: '7px',
            fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px',
            marginLeft: 4,
          }}
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right"></i> Logout
        </button>
      </div>
    </nav>
  );
}
