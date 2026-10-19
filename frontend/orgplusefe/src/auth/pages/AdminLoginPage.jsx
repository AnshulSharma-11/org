import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../AuthContext';
import AuthShell from '../AuthShell';
import { API_URL } from '../../config/apiConfig';

export let AUTH_BASE = `${API_URL}/api/v1/auth`;

const LETTERS_ONLY_REGEX = /^[A-Za-z\s]+$/;

function AuthCard({ children }) {
  return <AuthShell tone="hr" title="HR Panel">{children}</AuthShell>;
}

function LoginForm({ onSwitch }) {
  let { register, handleSubmit, formState: { errors } } = useForm();
  let { loginAdmin } = useAuth();
  let navigate = useNavigate();
  let location = useLocation();
  let [loading, setLoading] = useState(false);
  let from = location.state?.from?.pathname || '/admin';

  async function onSubmit(data) {
    setLoading(true);
    try {
      let res = await fetch(`${AUTH_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      let body = await res.json();
      if (res.ok && body.data?.token) {
        // Store token separately + full user object (without token) for display
        loginAdmin(body.data.token, body.data);
        toast.success(`Welcome back, ${body.data.fullName}!`);
        navigate(from, { replace: true });
      } else {
        toast.error(body.message || 'Invalid credentials');
      }
    } catch {
      toast.error('Server unreachable — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h5>Sign in to HR Panel</h5>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <label className="form-label" style={labelStyle}>Email</label>
          <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} style={inputStyle} placeholder="hr@company.com" {...register('email', { required: 'Email is required' })} />
          {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
        </div>
        <div className="mb-4">
          <label className="form-label" style={labelStyle}>Password</label>
          <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} style={inputStyle} placeholder="enter password" {...register('password', { required: 'Password is required' })} />
          {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
        </div>
        <button className="btn btn-primary w-100" style={{ borderRadius: 9, padding: '10px', fontWeight: 600 }} disabled={loading}>
          {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in…</> : <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>}
        </button>
      </form>
      <p className="auth-switch">
        No account? <button onClick={onSwitch} className="auth-link">Register here</button>
      </p>
    </>
    
  );
}

function RegisterForm({ onSwitch }) {
  let { register, handleSubmit, formState: { errors }, watch } = useForm();
  let [loading, setLoading] = useState(false);

  async function onSubmit(data) {
    setLoading(true);
    try {
      let res = await fetch(`${AUTH_BASE}/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: data.fullName, email: data.email, password: data.password }),
      });
      let body = await res.json();
      if (res.ok) { toast.success('Account created — please sign in'); onSwitch(); }
      else toast.error(body.message || 'Registration failed');
    } catch {
      toast.error('Server unreachable — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h5>Create HR Account</h5>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <label className="form-label" style={labelStyle}>Full Name</label>
          <input className={`form-control ${errors.fullName ? 'is-invalid' : ''}`} style={inputStyle} placeholder="frstname lastname " {...register('fullName', {
            required: 'Full name is required',
            pattern: {
              value: LETTERS_ONLY_REGEX,
              message: 'Full name must contain only letters and spaces'
            }
          })} />
          {errors.fullName && <div className="invalid-feedback">{errors.fullName.message}</div>}
        </div>
        <div className="mb-3">
          <label className="form-label" style={labelStyle}>Email</label>
          <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} style={inputStyle} placeholder="hr@company.com" {...register('email', { required: 'Email is required' })} />
          {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
        </div>
        <div className="mb-3">
          <label className="form-label" style={labelStyle}>Password</label>
          <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} style={inputStyle} placeholder="Min 6 characters" {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })} />
          {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
        </div>
        <div className="mb-4">
          <label className="form-label" style={labelStyle}>Confirm Password</label>
          <input type="password" className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} style={inputStyle} placeholder="Repeat password" {...register('confirmPassword', { required: 'Please confirm', validate: v => v === watch('password') || 'Passwords do not match' })} />
          {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword.message}</div>}
        </div>
        <button className="btn btn-primary w-100" style={{ borderRadius: 9, padding: '10px', fontWeight: 600 }} disabled={loading}>
          {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Registering…</> : <><i className="bi bi-person-plus me-2"></i>Create Account</>}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <button onClick={onSwitch} className="auth-link">Sign in</button>
      </p>
    </>

  );
}

export default function AdminLoginPage() {
  let [mode, setMode] = useState('login');
  return (
    <AuthCard>
      {mode === 'login' ? <LoginForm onSwitch={() => setMode('register')} /> : <RegisterForm onSwitch={() => setMode('login')} />}
    </AuthCard>
  );
}

let labelStyle = { fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-2)', marginBottom: 4 };
let inputStyle = { borderRadius: 8, fontSize: '0.9rem' };
