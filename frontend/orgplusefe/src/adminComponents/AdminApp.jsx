import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminNavbar from './navbar/AdminNavbar';
import ThemeToggle from '../components/ThemeToggle';
import { BrandMark } from '../components/BrandLogo';

/** HR panel shell: sidebar on desktop, slide-in drawer + top bar on mobile. */
export default function AdminApp() {
  let [open, setOpen] = useState(false);
  let location = useLocation();

  // Close the drawer after navigating to another page
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Lock page scroll while the drawer is open + close with Esc
  useEffect(() => {
    document.body.classList.toggle('drawer-open', open);
    let onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.classList.remove('drawer-open'); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <>
      <header className="hrms-mobilebar">
        <button type="button" className="nav-toggle-btn" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <i className="bi bi-list"></i>
        </button>
        <div className="mb-brand">
          <BrandMark size={34} />
          <div>ORGPLUS<small>HR Panel</small></div>
        </div>
        <div className="mb-tools"><ThemeToggle onDark /></div>
      </header>

      <div className={`hrms-backdrop ${open ? 'show' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <AdminNavbar open={open} onClose={() => setOpen(false)} />

      <div className="hrms-main">
        <Outlet />
      </div>
    </>
  );
}
