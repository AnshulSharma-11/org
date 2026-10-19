import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import '../charts/charts.css';

/**
 * Shared frame for the HR and Employee report pages.
 *  tabs     : [{ id, label, icon, render }]
 *  ranges   : [{ value, label }]  (e.g. 6 / 12 months)
 */
export default function ReportShell({
  title, subtitle, icon = 'bi-graph-up-arrow', tabs, ranges, range, onRange,
  onRefresh, loading, updatedAt, failed = [], children,
}) {
  const [active, setActive] = useState(tabs[0].id);
  const [printing, setPrinting] = useState(false);
  const { theme } = useTheme();

  // Print / Save-as-PDF: render every tab, force the light theme, then restore.
  const handlePrint = useCallback(() => {
    setPrinting(true);
    const root = document.documentElement;
    const restore = () => {
      root.setAttribute('data-theme', theme);
      root.setAttribute('data-bs-theme', theme);
      setPrinting(false);
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    root.setAttribute('data-theme', 'light');
    root.setAttribute('data-bs-theme', 'light');
    setTimeout(() => window.print(), 350);
  }, [theme]);

  useEffect(() => () => setPrinting(false), []);

  const current = tabs.find((t) => t.id === active) || tabs[0];
  const visible = printing ? tabs : [current];

  return (
    <div className="hrms-content">
      <div className="page-header">
        <div>
          <h4><i className={`bi ${icon}`}></i> {title}</h4>
          {subtitle && <div className="rp-card-sub" style={{ marginTop: 4 }}>{subtitle}</div>}
        </div>
        <div className="rp-toolbar rp-noprint">
          {ranges && (
            <div className="rp-seg" role="group" aria-label="Time range">
              {ranges.map((r) => (
                <button key={r.value} type="button" className={range === r.value ? 'on' : ''} onClick={() => onRange(r.value)}>{r.label}</button>
              ))}
            </div>
          )}
          <button type="button" className="rp-btn" onClick={onRefresh} disabled={loading} title="Reload data">
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i><span className="rp-hide-sm">Refresh</span>
          </button>
          <button type="button" className="rp-btn" onClick={handlePrint} title="Print or save as PDF">
            <i className="bi bi-printer"></i><span className="rp-hide-sm">Print / PDF</span>
          </button>
        </div>
      </div>

      {updatedAt && <div className="rp-updated rp-noprint" style={{ marginTop: -12, marginBottom: 14 }}>Updated {updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>}

      {failed.length > 0 && (
        <div className="rp-alert" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>Some data could not be loaded ({failed.join(', ')}). Charts that depend on it may be empty.</span>
        </div>
      )}

      <div className="rp-tabs rp-noprint" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === current.id}
            className={`rp-tab ${t.id === current.id ? 'on' : ''}`} onClick={() => setActive(t.id)}>
            <i className={`bi ${t.icon}`}></i>{t.label}
          </button>
        ))}
      </div>

      {children /* e.g. loading skeleton or content wrapper */}
      {visible.map((t) => (
        <div key={t.id} role="tabpanel">
          {printing && <h5 className="rp-section-title" style={{ marginTop: 18 }}>{t.label}</h5>}
          {t.render()}
        </div>
      ))}
    </div>
  );
}
