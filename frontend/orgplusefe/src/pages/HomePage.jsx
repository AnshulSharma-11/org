import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';
import './home.css';

// Modules that actually exist in the HR / employee panels
const FEATURES = [
  { icon: 'bi-people-fill',        title: 'Employee Management',   text: 'Maintain complete employee records, profiles and documents in one place.' },
  { icon: 'bi-diagram-3-fill',     title: 'Branches & Departments', text: 'Organise your company by branches, departments and designations.' },
  { icon: 'bi-clock-history',      title: 'Time & Attendance',     text: 'Track working hours and attendance records for every employee.' },
  { icon: 'bi-calendar-check-fill', title: 'Leave Management',      text: 'Apply, review and approve leave requests with a clear leave balance.' },
  { icon: 'bi-cash-stack',         title: 'Payroll',               text: 'Run payroll and let employees view their own payslip details securely.' },
  { icon: 'bi-graph-up-arrow',     title: 'Performance Reviews',   text: 'Record and follow performance reviews to support employee growth.' },
  { icon: 'bi-kanban-fill',        title: 'Projects',              text: 'Create projects and assign employees so everyone knows what they work on.' },
  { icon: 'bi-headset',            title: 'Help Desk',             text: 'Employees raise requests; HR responds and resolves them quickly.' },
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  // Sticky navbar styling
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reveal-on-scroll
  useEffect(() => {
    const els = document.querySelectorAll('.op-reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="op-home">
      {/* ── Navbar ───────────────────────── */}
      <header className={`op-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="op-container op-nav-inner">
          <a href="#top" aria-label="ORGPLUS home">
            <BrandLogo />
          </a>
          <div className="op-nav-right">
            <nav className="op-nav-links">
              <a href="#features">Features</a>
              <a href="#portals">Portals</a>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────── */}
      <section className="op-hero" id="top">
        <div className="op-container op-hero-grid">
          <div>
            <span className="op-pill">
              <i className="bi bi-people-fill"></i> Employee Management System
            </span>
            <h1>
              Manage your people,<br />
              <span className="op-accent">simply and smartly.</span>
            </h1>
            <p className="lead">
              ORGPLUS brings employees, attendance, leaves, payroll, projects and
              performance together in a single platform — with a dedicated panel for
              the HR team and another for employees.
            </p>

            {/* ★ The two login buttons ★ */}
            <div className="op-cta">
              <Link to="/admin/login" className="op-btn op-btn-admin">
                <i className="bi bi-shield-lock-fill lead-ico"></i>
                HR Panel Login
                <i className="bi bi-arrow-right arrow"></i>
              </Link>
              <Link to="/employee/login" className="op-btn op-btn-emp">
                <i className="bi bi-person-badge-fill lead-ico"></i>
                Employee Panel Login
                <i className="bi bi-arrow-right arrow"></i>
              </Link>
            </div>

            <div className="op-trust">
              <span><i className="bi bi-check-circle-fill"></i> Secure role-based access</span>
              <span><i className="bi bi-check-circle-fill"></i> Everything in one place</span>
            </div>
          </div>

          {/* Decorative dashboard mock-up */}
          <div className="op-visual" aria-hidden="true">
            <div className="op-circle"></div>
            <div className="op-circle sm"></div>

            <div className="op-card-flat op-dash">
              <div className="op-dash-head">
                <div className="op-dots"><i></i><i></i><i></i></div>
                <div className="op-dash-title">Dashboard</div>
              </div>
              <div className="op-dash-body">
                <div className="op-stats">
                  {[['bi-people-fill', '78%'], ['bi-calendar-check-fill', '54%'], ['bi-cash-stack', '66%']].map(([ic, w]) => (
                    <div className="op-stat" key={ic}>
                      <i className={`bi ${ic}`}></i>
                      <div className="l1"></div>
                      <div className="bar"><b style={{ width: w }}></b></div>
                    </div>
                  ))}
                </div>
                <div className="op-chart">
                  {[45, 70, 55, 88, 62, 95, 74].map((h, i) => (
                    <span key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}></span>
                  ))}
                </div>
              </div>
            </div>

            <div className="op-card-flat op-chip c1">
              <span className="ico"><i className="bi bi-check2-circle"></i></span>
              <div>Leave approved<small>Request processed</small></div>
            </div>
            <div className="op-card-flat op-chip c2">
              <span className="ico"><i className="bi bi-receipt"></i></span>
              <div>Payroll ready<small>Payslip available</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────── */}
      <section className="op-section op-features" id="features">
        <div className="op-container">
          <div className="op-head op-reveal">
            <div className="op-eyebrow">Features</div>
            <h2 className="op-title">Everything your HR team needs</h2>
            <p className="op-sub">
              From onboarding to payroll, every part of the employee journey is
              covered by one connected system.
            </p>
          </div>
          <div className="op-fgrid">
            {FEATURES.map((f, i) => (
              <div className="op-fcard op-reveal" key={f.title} style={{ transitionDelay: `${(i % 4) * 80}ms` }}>
                <div className="op-ficon"><i className={`bi ${f.icon}`}></i></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portals ──────────────────────── */}
      <section className="op-section op-portals" id="portals">
        <div className="op-container">
          <div className="op-head op-reveal">
            <div className="op-eyebrow">Two portals</div>
            <h2 className="op-title">Choose how you sign in</h2>
            <p className="op-sub">Each role gets a workspace built around what they need to do.</p>
          </div>
          <div className="op-pgrid">
            <Link to="/admin/login" className="op-pcard admin op-reveal">
              <div className="ico"><i className="bi bi-shield-lock-fill"></i></div>
              <h3>HR Panel</h3>
              <p>For the HR team and administrators</p>
              <ul>
                <li><i className="bi bi-check-circle-fill"></i> Manage employees, branches &amp; departments</li>
                <li><i className="bi bi-check-circle-fill"></i> Approve leaves &amp; review attendance</li>
                <li><i className="bi bi-check-circle-fill"></i> Run payroll &amp; performance reviews</li>
                <li><i className="bi bi-check-circle-fill"></i> Assign projects &amp; handle help requests</li>
              </ul>
              <span className="op-plink">Go to HR Login <i className="bi bi-arrow-right"></i></span>
            </Link>

            <Link to="/employee/login" className="op-pcard emp op-reveal" style={{ transitionDelay: '100ms' }}>
              <div className="ico"><i className="bi bi-person-badge-fill"></i></div>
              <h3>Employee Panel</h3>
              <p>For every member of your team</p>
              <ul>
                <li><i className="bi bi-check-circle-fill"></i> View your profile &amp; documents</li>
                <li><i className="bi bi-check-circle-fill"></i> Apply for leave &amp; track status</li>
                <li><i className="bi bi-check-circle-fill"></i> Check attendance &amp; payroll</li>
                <li><i className="bi bi-check-circle-fill"></i> See your projects &amp; raise help requests</li>
              </ul>
              <span className="op-plink">Go to Employee Login <i className="bi bi-arrow-right"></i></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────── */}
      <footer className="op-footer">
        <div className="op-container op-footer-in">
          <BrandLogo />
          <div>© {new Date().getFullYear()} ORGPLUS · Employee Management System</div>
        </div>
      </footer>
    </div>
  );
}
