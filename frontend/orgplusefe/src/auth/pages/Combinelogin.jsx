import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import { BrandMark } from '../../components/BrandLogo';

// Role chooser. The main entry point is now the Home page (/), this page is kept for older links.
export default function Combinelogin() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-theme"><ThemeToggle /></div>
      <div className="auth-card">
        <div className="auth-head hr">
          <BrandMark />
          <div>
            <div className="t1">Welcome to ORGPLUS</div>
            <div className="t2">Select your login type</div>
          </div>
        </div>
        <div className="auth-body d-grid gap-3">
          <button className="btn btn-primary py-2 fw-semibold" onClick={() => navigate('/admin/login')}>
            <i className="bi bi-shield-lock-fill me-2"></i>HR Login
          </button>
          <button className="btn btn-outline-primary py-2 fw-semibold" onClick={() => navigate('/employee/login')}>
            <i className="bi bi-person-badge-fill me-2"></i>Employee Login
          </button>
        </div>
      </div>
      <a href="/" className="auth-back"><i className="bi bi-arrow-left"></i> Back to Home</a>
    </div>
  );
}
