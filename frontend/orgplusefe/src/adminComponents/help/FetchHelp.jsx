import authFetch from '../../config/authFetch';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ADMIN_BASE } from '../../config/apiConfig';
import DisplayHelp from './DisplayHelp';
import PromptModal from '../../components/PromptModal';

function FilterBar({ onFilter, departments }) {
  let { register, handleSubmit, reset } = useForm();
  return (
    <form className="filter-bar" onSubmit={handleSubmit(onFilter)}>
      <input
        className="form-control"
        style={{ maxWidth: 200 }}
        placeholder="Search subject..."
        {...register('search')}
      />
      <select className="form-select" style={{ maxWidth: 190 }} {...register('requestType')}>
        <option value="">All Types</option>
        <option value="COMPLAINT">Complaint</option>
        <option value="DEPARTMENT_CHANGE">Department Change</option>
        <option value="DESIGNATION_CHANGE">Designation Change</option>
        <option value="PAYROLL_ISSUE">Payroll Issue</option>
        <option value="ATTENDANCE_ISSUE">Attendance Issue</option>
        <option value="LEAVE_ISSUE">Leave Issue</option>
        <option value="GENERAL_SUPPORT">General Support</option>
        <option value="TECHNICAL_SUPPORT">Technical Support</option>
      </select>
      <select className="form-select" style={{ maxWidth: 150 }} {...register('status')}>
        <option value="">All Status</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="RESOLVED">Resolved</option>
        <option value="CLOSED">Closed</option>
      </select>
      <select className="form-select" style={{ maxWidth: 140 }} {...register('priority')}>
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>
      <input
        className="form-control"
        style={{ maxWidth: 160 }}
        placeholder="Employee ID"
        {...register('employeeId')}
      />
      <button className="btn btn-primary btn-sm px-3">Apply</button>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => { reset(); onFilter({}); }}
      >
        Reset
      </button>
    </form>
  );
}

export default function FetchHelp() {
  let [helpItems, setHelpItems]   = useState(null);
  let [isRefresh, setIsRefresh]   = useState(false);
  let [filters, setFilters]       = useState({});
  let [employees, setEmployees]   = useState([]);
  let [departments, setDepartments] = useState([]);

  // ── Resolve modal state ───────────────────────────────────────────────────
  let [resolveModal, setResolveModal] = useState({ open: false, help: null });

  function openResolveModal(help)  { setResolveModal({ open: true, help }); }
  function closeResolveModal()     { setResolveModal({ open: false, help: null }); }

  async function confirmResolve(notes) {
    const help = resolveModal.help;
    closeResolveModal();
    try {
      let res = await authFetch(`${ADMIN_BASE}/help/${help.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...help,
          status: 'RESOLVED',
          resolutionNotes: notes,
          resolvedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) { toast.success('Help resolved'); setIsRefresh(v => !v); }
      else toast.error('Failed to resolve help');
    } catch { toast.error('Failed to resolve help'); }
  }

  useEffect(() => {
    Promise.all([
      authFetch(`${ADMIN_BASE}/employees?size=200`).then(r => r.json()),
      authFetch(`${ADMIN_BASE}/departments?size=200`).then(r => r.json()),
    ]).then(([empRes, deptRes]) => {
      setEmployees(empRes.data?.content ?? []);
      setDepartments(deptRes.data?.content ?? []);
    });
  }, []);

  useEffect(() => {
    async function load() {
      try {
        let url = `${ADMIN_BASE}/help/filter?`;
        if (filters.search)      url += `search=${encodeURIComponent(filters.search)}&`;
        if (filters.requestType) url += `requestType=${filters.requestType}&`;
        if (filters.status)      url += `status=${filters.status}&`;
        if (filters.priority)    url += `priority=${filters.priority}&`;
        if (filters.employeeId)  url += `employeeId=${filters.employeeId}&`;
        let res = await authFetch(url);
        let obj = await res.json();
        setHelpItems(obj.data?.content ?? []);
      } catch {
        setHelpItems([]);
        toast.error('Failed to load help requests');
      }
    }
    load();
  }, [isRefresh, filters]);

  async function assignHelp(help, assigneeId) {
    try {
      let res = await authFetch(`${ADMIN_BASE}/help/${help.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...help, assignedTo: { id: parseInt(assigneeId, 10) } }),
      });
      if (res.ok) { toast.success('Help assigned'); setIsRefresh(v => !v); }
      else toast.error('Failed to assign help');
    } catch { toast.error('Failed to assign help'); }
  }

  async function updateStatus(help, newStatus) {
    try {
      let res = await authFetch(`${ADMIN_BASE}/help/${help.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...help, status: newStatus }),
      });
      if (res.ok) { toast.success(`Status updated to ${newStatus}`); setIsRefresh(v => !v); }
      else toast.error('Failed to update status');
    } catch { toast.error('Failed to update status'); }
  }

  async function deleteHelp(id) {
    try {
      let res = await authFetch(`${ADMIN_BASE}/help/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Help request deleted'); setIsRefresh(v => !v); }
      else toast.error('Failed to delete help request');
    } catch { toast.error('Failed to delete help request'); }
  }

  if (helpItems === null) return (
    <div className="hrms-content">
      <div className="d-flex align-items-center gap-2">
        <span className="spinner-border spinner-border-sm"></span> Loading...
      </div>
    </div>
  );

  return (
    <>
      <PromptModal
        show={resolveModal.open}
        title="Resolve Help Request"
        label="Resolution notes"
        placeholder="Describe how this request was resolved…"
        required={true}
        submitLabel="Mark Resolved"
        submitVariant="success"
        onConfirm={confirmResolve}
        onCancel={closeResolveModal}
      />
      <DisplayHelp
        helpValue={helpItems}
        employees={employees}
        onAssign={assignHelp}
        onStatusChange={updateStatus}
        onResolve={openResolveModal}
        onDelete={deleteHelp}
        onFilter={setFilters}
        FilterBar={(props) => <FilterBar {...props} departments={departments} />}
      />
    </>
  );
}
