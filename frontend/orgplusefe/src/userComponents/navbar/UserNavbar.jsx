import React, { useEffect, useState } from 'react';
import { NavLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';
import { BrandMark } from '../../components/BrandLogo';

export default function UserNavbar() {
  let { employeeId } = useParams();
  let { logoutEmployee } = useAuth();
  let navigate = useNavigate();
  let location = useLocation();
  let [open, setOpen] = useState(false);
  let base = `/employee/${employeeId}`;
  let linkClass = ({ isActive }) => isActive ? 'active' : '';

  // Close the mobile menu after navigating, and with Esc
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    let onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function handleLogout() {
    logoutEmployee();
    navigate('/employee/login', { replace: true });
  }

  return (
    <nav className="user-navbar">
      <NavLink to={base} end className="brand">
        <BrandMark />
        <span>ORGPLUS<small>Employee Portal</small></span>
      </NavLink>

      <div className="nav-tools">
        <div className={`nav-links ${open ? 'open' : ''}`} id="employee-nav-links">
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
          <NavLink to={`${base}/reports`} className={linkClass}>
            <i className="bi bi-graph-up-arrow"></i> Reports
          </NavLink>
          <button className="nav-logout" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>

        <ThemeToggle onDark />

        <button
          type="button"
          className="nav-toggle nav-toggle-btn"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="employee-nav-links"
          onClick={() => setOpen(o => !o)}
        >
          <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'}`}></i>
        </button>
      </div>
    </nav>
  );
}
