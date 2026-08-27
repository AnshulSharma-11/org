import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../AuthContext';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

export let AUTH_BASE = `${API_URL}/api/v1/auth`;

const LETTERS_ONLY_REGEX = /^[A-Za-z\s]+$/;

function AuthCard({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#1e293b,#2563eb)', padding: '28px 32px 24px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <i className="bi bi-people-circle" style={{ fontSize: '2rem' }}></i>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>ORGPLUSE</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Admin Panel</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '28px 32px 32px' }}>{children}</div>
      </div>
    </div>
  );
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
      <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Sign in to Admin</h5>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <label className="form-label" style={labelStyle}>Email</label>
          <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} style={inputStyle} placeholder="admin@company.com" {...register('email', { required: 'Email is required' })} />
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
      <p style={{ marginTop: 20, fontSize: '0.85rem', textAlign: 'center', color: '#64748b' }}>
        No account? <button onClick={onSwitch} style={linkBtnStyle}>Register here</button>
      </p>
      <div style={{ minHeight:'10vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, fontFamily:'sans-serif', color:'#64748b' }}>
        
        <a href="/combinelogin" style={{ color:'#2563eb', textDecoration:'none', fontWeight:600 }}>← Back to Rolles</a>
      </div>
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
      <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Create Admin Account</h5>
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
          <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} style={inputStyle} placeholder="admin@company.com" {...register('email', { required: 'Email is required' })} />
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
      <p style={{ marginTop: 20, fontSize: '0.85rem', textAlign: 'center', color: '#64748b' }}>
        Already have an account? <button onClick={onSwitch} style={linkBtnStyle}>Sign in</button>
      </p>
       <div style={{ minHeight:'10vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, fontFamily:'sans-serif', color:'#64748b' }}>
        
        <a href="/combinelogin" style={{ color:'#2563eb', textDecoration:'none', fontWeight:600 }}>← Back to Rolles</a>
      </div>
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

let labelStyle = { fontWeight: 600, fontSize: '0.83rem', color: '#374151', marginBottom: 4 };
let inputStyle = { borderRadius: 8, fontSize: '0.9rem' };
let linkBtnStyle = { background: 'none', border: 'none', padding: 0, color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' };
