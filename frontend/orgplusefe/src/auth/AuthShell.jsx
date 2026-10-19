import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { BrandMark } from '../components/BrandLogo';

/**
 * Shared frame for the HR-panel and Employee-panel login pages.
 *   tone  : 'hr' | 'emp'   (header colour)
 *   title : e.g. "HR Panel"
 */
export default function AuthShell({ tone = 'hr', title, children }) {
  return (
    <div className="auth-page">
      <div className="auth-theme"><ThemeToggle /></div>

      <div className="auth-card">
        <div className={`auth-head ${tone}`}>
          <BrandMark />
          <div>
            <div className="t1">ORGPLUS</div>
            <div className="t2">{title}</div>
          </div>
        </div>
        <div className="auth-body">{children}</div>
      </div>

      <Link to="/" className="auth-back"><i className="bi bi-arrow-left"></i> Back to Home</Link>
    </div>
  );
}
