import authFetch from '../../config/authFetch';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { EMPLOYEE_BASE } from '../../config/apiConfig';

// ── File-type icon helper ─────────────────────────────────────────────────────
function fileIcon(mimeType, originalName) {
  let ext = (originalName || '').split('.').pop().toLowerCase();
  if (!mimeType) mimeType = '';

  if (mimeType.includes('pdf') || ext === 'pdf')
    return { icon: 'bi-file-earmark-pdf-fill', color: '#e53935' };
  if (mimeType.includes('image') || ['jpg','jpeg','png','gif','webp','svg'].includes(ext))
    return { icon: 'bi-file-earmark-image-fill', color: '#1e88e5' };
  if (mimeType.includes('word') || ['doc','docx'].includes(ext))
    return { icon: 'bi-file-earmark-word-fill', color: '#1565c0' };
  if (mimeType.includes('sheet') || mimeType.includes('excel') || ['xls','xlsx','csv'].includes(ext))
    return { icon: 'bi-file-earmark-spreadsheet-fill', color: '#2e7d32' };
  if (mimeType.includes('zip') || mimeType.includes('compressed') || ['zip','rar','7z'].includes(ext))
    return { icon: 'bi-file-earmark-zip-fill', color: '#f57c00' };
  if (mimeType.includes('text') || ['txt','md'].includes(ext))
    return { icon: 'bi-file-earmark-text-fill', color: '#546e7a' };
  return { icon: 'bi-file-earmark-fill', color: '#78909c' };
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Upload panel ─────────────────────────────────────────────────────────────
function UploadPanel({ employeeId, onUploaded }) {
  let fileRef  = useRef(null);
  let [file,     setFile]     = useState(null);
  let [label,    setLabel]    = useState('');
  let [dragging, setDragging] = useState(false);
  let [uploading, setUploading] = useState(false);

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    if (!label) setLabel(f.name.replace(/\.[^/.]+$/, ''));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    let f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  async function handleUpload() {
    if (!file) { toast.error('Please select a file first'); return; }
    setUploading(true);
    try {
      let fd = new FormData();
      fd.append('file', file);
      if (label.trim()) fd.append('label', label.trim());

      let res = await authFetch(`${EMPLOYEE_BASE(employeeId)}/documents`, {
        method: 'POST',
        body: fd,
      });
      let body = await res.json();
      if (res.ok) {
        toast.success('Document uploaded!');
        setFile(null);
        setLabel('');
        if (fileRef.current) fileRef.current.value = '';
        onUploaded();
      } else {
        toast.error(body.message || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  let { icon, color } = file ? fileIcon(file.type, file.name) : { icon: 'bi-cloud-upload', color: '#94a3b8' };

  return (
    <div className="hrms-card mb-4">
      <h6 style={{ fontWeight: 700, marginBottom: 16, color: '#0f172a',
        display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="bi bi-upload" style={{ color: '#2563eb' }}></i> Upload New Document
      </h6>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#2563eb' : '#cbd5e1'}`,
          borderRadius: 12,
          padding: '28px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#eff6ff' : '#f8fafc',
          transition: 'all 0.15s',
          marginBottom: 16,
        }}
      >
        <i className={`bi ${icon}`}
          style={{ fontSize: '2.2rem', color, display: 'block', marginBottom: 8 }}></i>
        {file ? (
          <>
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{file.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
              {formatBytes(file.size)} — click or drop to replace
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 500, color: '#475569', fontSize: '0.88rem' }}>
              Click to browse or drag &amp; drop
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
              PDF, Word, Excel, images — up to 10 MB
            </div>
          </>
        )}
        <input
          type="file"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={e => pickFile(e.target.files?.[0])}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.txt,.zip"
        />
      </div>

      {/* Label */}
      <div className="mb-3">
        <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
          Document Label <span style={{ color: '#94a3b8' }}>(optional)</span>
        </label>
        <input
          type="text"
          className="form-control"
          placeholder="e.g. Offer Letter, PAN Card, Degree Certificate"
          value={label}
          onChange={e => setLabel(e.target.value)}
          maxLength={100}
        />
      </div>

      <button
        className="btn btn-primary px-4"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading
          ? <><span className="spinner-border spinner-border-sm me-2"></span>Uploading…</>
          : <><i className="bi bi-cloud-upload me-2"></i>Upload Document</>}
      </button>
    </div>
  );
}

// ── Document card ─────────────────────────────────────────────────────────────
function DocumentCard({ doc, employeeId, onDeleted }) {
  let [deleting,    setDeleting]    = useState(false);
  let [downloading, setDownloading] = useState(false);
  let { icon, color } = fileIcon(doc.fileType, doc.originalName);

  async function handleDownload() {
    setDownloading(true);
    try {
      let res = await authFetch(
        `${EMPLOYEE_BASE(employeeId)}/documents/${doc.id}/download`
      );
      if (!res.ok) { toast.error('Download failed'); return; }
      let blob = await res.blob();
      let url  = URL.createObjectURL(blob);
      let a    = document.createElement('a');
      a.href     = url;
      a.download = doc.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${doc.documentLabel}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      let res = await authFetch(
        `${EMPLOYEE_BASE(employeeId)}/documents/${doc.id}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        toast.success('Document deleted');
        onDeleted(doc.id);
      } else {
        let body = await res.json();
        toast.error(body.message || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      background: '#fff',
      marginBottom: 10,
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <i className={`bi ${icon}`} style={{ fontSize: '1.4rem', color }}></i>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {doc.documentLabel}
        </div>
        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
          {doc.originalName} &nbsp;·&nbsp; {formatBytes(doc.fileSize)}
          &nbsp;·&nbsp; {formatDate(doc.uploadedAt)}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={handleDownload}
          disabled={downloading}
          title="Download"
        >
          {downloading
            ? <span className="spinner-border spinner-border-sm"></span>
            : <i className="bi bi-download"></i>}
        </button>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
        >
          {deleting
            ? <span className="spinner-border spinner-border-sm"></span>
            : <i className="bi bi-trash"></i>}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyDocuments() {
  let { employeeId } = useParams();
  let [docs,    setDocs]    = useState([]);
  let [loading, setLoading] = useState(true);

  const loadDocs = useCallback(function loadDocs() {
    setLoading(true);
    authFetch(`${EMPLOYEE_BASE(employeeId)}/documents`)
      .then(r => r.json())
      .then(obj => setDocs(obj.data?.content ?? obj.data ?? []))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  }, [employeeId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  function onDeleted(id) {
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  return (
    <div>
      <div className="page-header">
        <h4><i className="bi bi-folder2-open"></i> My Documents</h4>
        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
          {docs.length} document{docs.length !== 1 ? 's' : ''}
        </span>
      </div>

      <UploadPanel employeeId={employeeId} onUploaded={loadDocs} />

      <div className="hrms-card">
        <h6 style={{ fontWeight: 700, marginBottom: 16, color: '#0f172a',
          display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-files" style={{ color: '#2563eb' }}></i> Uploaded Documents
        </h6>

        {loading ? (
          <div className="d-flex align-items-center gap-2 text-muted py-3">
            <span className="spinner-border spinner-border-sm"></span> Loading…
          </div>
        ) : docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <i className="bi bi-folder2 d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.35 }}></i>
            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>No documents uploaded yet</div>
            <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
              Use the upload panel above to add your first document.
            </div>
          </div>
        ) : (
          docs.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              employeeId={employeeId}
              onDeleted={onDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}
