import authFetch from '../../config/authFetch';
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';

/**
 * AssignEmployeesModal
 * Props:
 *   project       — { id, name, employees: [...] }
 *   onClose()     — called on cancel or after confirm
 *   onSaved()     — called after a successful save so parent can refresh
 */
export default function AssignEmployeesModal({ project, onClose, onSaved }) {
  let [allEmployees, setAllEmployees] = useState([]);
  let [selected, setSelected]         = useState(new Set());
  let [search, setSearch]             = useState('');
  let [loading, setLoading]           = useState(true);
  let [saving, setSaving]             = useState(false);
  let searchRef = useRef(null);

  // Pre-populate selected from current project employees
  let originalIds = new Set((project.employees ?? []).map(e => e.id));

  useEffect(() => {
    authFetch(`${ADMIN_BASE}/employees?size=200`)
      .then(r => r.json())
      .then(obj => {
        setAllEmployees(obj.data?.content ?? obj.data ?? []);
        setSelected(new Set(originalIds));
        setLoading(false);
        // Focus search box after load
        setTimeout(() => searchRef.current?.focus(), 50);
      })
      .catch(() => {
        toast.error('Failed to load employees');
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  function toggle(id) {
    setSelected(prev => {
      let next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  let filtered = allEmployees.filter(e => {
    let q = search.toLowerCase();
    return (
      e.firstName?.toLowerCase().includes(q) ||
      e.lastName?.toLowerCase().includes(q) ||
      e.designation?.name?.toLowerCase().includes(q)
    );
  });

  async function handleConfirm() {
    setSaving(true);
    try {
      // Employees to ADD (in selected but not in original)
      let toAdd    = [...selected].filter(id => !originalIds.has(id));
      // Employees to REMOVE (in original but not in selected)
      let toRemove = [...originalIds].filter(id => !selected.has(id));

      let addPromises = toAdd.map(empId =>
        authFetch(`${ADMIN_BASE}/projects/${project.id}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeIds: [empId] }),
        })
      );
      let removePromises = toRemove.map(empId =>
        authFetch(`${ADMIN_BASE}/projects/${project.id}/employees/${empId}`, {
          method: 'DELETE',
        })
      );

      await Promise.all([...addPromises, ...removePromises]);
      toast.success('Assignments updated');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to update assignments');
    } finally {
      setSaving(false);
    }
  }

  // Trap focus inside modal on Escape → close
  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose();
  }

  return (
    // Backdrop
    <div
      className="modal d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Assign employees to ${project.name}`}
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 520 }}>
        <div className="modal-content">

          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-people me-2"></i>
              Assign Employees
              <small className="text-muted ms-2 fw-normal" style={{ fontSize: '0.85em' }}>
                {project.name}
              </small>
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            />
          </div>

          {/* Body */}
          <div className="modal-body p-0">
            {/* Search */}
            <div className="p-3 border-bottom">
              <input
                ref={searchRef}
                className="form-control"
                placeholder="Search by name or designation…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search employees"
              />
              <div className="d-flex justify-content-between mt-2" style={{ fontSize: 12, color: '#64748b' }}>
                <span>{filtered.length} employee{filtered.length !== 1 ? 's' : ''}</span>
                <span>{selected.size} selected</span>
              </div>
            </div>

            {/* Checklist */}
            <div
              style={{ maxHeight: 340, overflowY: 'auto' }}
              role="group"
              aria-label="Employee selection list"
            >
              {loading ? (
                <div className="d-flex align-items-center gap-2 p-4">
                  <span className="spinner-border spinner-border-sm"></span> Loading employees…
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-muted text-center py-4 mb-0">No employees match your search.</p>
              ) : (
                filtered.map(emp => {
                  let isChecked = selected.has(emp.id);
                  let checkId   = `emp-check-${emp.id}`;
                  return (
                    <label
                      key={emp.id}
                      htmlFor={checkId}
                      className="d-flex align-items-center gap-3 px-3 py-2 border-bottom"
                      style={{
                        cursor: 'pointer',
                        background: isChecked ? '#eff6ff' : 'transparent',
                        transition: 'background .1s',
                      }}
                    >
                      <input
                        type="checkbox"
                        id={checkId}
                        className="form-check-input mt-0 flex-shrink-0"
                        checked={isChecked}
                        onChange={() => toggle(emp.id)}
                        aria-label={`${emp.firstName} ${emp.lastName}`}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="fw-500" style={{ fontSize: 14 }}>
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {emp.designation?.name ?? '—'}
                          {emp.department?.name ? ` · ${emp.department.name}` : ''}
                        </div>
                      </div>
                      {isChecked && (
                        <i className="bi bi-check-circle-fill text-primary" style={{ fontSize: 16 }}></i>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary px-4"
              onClick={handleConfirm}
              disabled={saving || loading}
            >
              {saving
                ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving…</>
                : 'Confirm'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
