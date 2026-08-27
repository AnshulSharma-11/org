import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

/**
 * PromptModal — accessible replacement for window.prompt()
 *
 * Props
 *   show       {boolean}  – whether the modal is visible
 *   title      {string}   – modal heading
 *   label      {string}   – textarea label
 *   placeholder {string}  – textarea placeholder text
 *   required   {boolean}  – whether the field is mandatory (default false)
 *   submitLabel {string}  – submit button text (default "Confirm")
 *   submitVariant {string} – Bootstrap btn variant (default "primary")
 *   onConfirm  {(value: string) => void} – called with the textarea value
 *   onCancel   {() => void}              – called on Cancel or backdrop click
 */
export default function PromptModal({
  show,
  title,
  label,
  placeholder = '',
  required = false,
  submitLabel = 'Confirm',
  submitVariant = 'primary',
  onConfirm,
  onCancel,
}) {
  let { register, handleSubmit, formState: { errors }, reset, setFocus } = useForm();
  let backdropRef = useRef(null);

  // Auto-focus textarea when modal opens; reset on close
  useEffect(() => {
    if (show) {
      reset();
      // Small delay lets the element finish rendering before focusing
      let t = setTimeout(() => setFocus('note'), 60);
      return () => clearTimeout(t);
    }
  }, [show, reset, setFocus]);

  // Close on Escape key
  useEffect(() => {
    if (!show) return;
    function onKey(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show, onCancel]);

  if (!show) return null;

  function onSubmit(data) {
    onConfirm(data.note ?? '');
    reset();
  }

  function handleBackdrop(e) {
    if (e.target === backdropRef.current) onCancel();
  }

  return (
    /* Backdrop */
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pm-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 1055,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'pmFadeIn 0.15s ease',
      }}
    >
      {/* Dialog */}
      <div
        style={{
          background: '#fff', borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          width: '100%', maxWidth: 480,
          animation: 'pmSlideUp 0.18s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 14px',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <h6 id="pm-title" style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
            {title}
          </h6>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', fontSize: '1.2rem', padding: '2px 6px',
              lineHeight: 1, borderRadius: 6,
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ padding: '20px 22px' }}>
            <label
              htmlFor="pm-note"
              style={{ display: 'block', fontWeight: 600, fontSize: '0.83rem', color: '#374151', marginBottom: 6 }}
            >
              {label}
              {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
            </label>
            <textarea
              id="pm-note"
              rows={4}
              placeholder={placeholder}
              className={`form-control ${errors.note ? 'is-invalid' : ''}`}
              style={{ borderRadius: 8, fontSize: '0.9rem', resize: 'vertical' }}
              {...register('note', {
                validate: v =>
                  !required || (v && v.trim().length > 0) || 'This field is required',
                maxLength: { value: 500, message: 'Maximum 500 characters' },
              })}
            />
            {errors.note && (
              <div className="invalid-feedback" style={{ display: 'block' }}>
                {errors.note.message}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            padding: '14px 22px 20px',
            borderTop: '1px solid #f1f5f9',
          }}>
            <button
              type="button"
              className="btn btn-outline-secondary"
              style={{ borderRadius: 8, minWidth: 88 }}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-${submitVariant}`}
              style={{ borderRadius: 8, minWidth: 100, fontWeight: 600 }}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>

      {/* Keyframe animations — injected once */}
      <style>{`
        @keyframes pmFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pmSlideUp { from { transform: translateY(12px); opacity: 0 }
                               to   { transform: translateY(0);    opacity: 1 } }
      `}</style>
    </div>
  );
}
