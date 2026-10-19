import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../AuthContext';
import AuthShell from '../AuthShell';
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

export let AUTH_BASE = `${API_URL}/api/v1/auth`;


function AuthCard({ children }) {
  return <AuthShell tone="emp" title="Employee Portal">{children}</AuthShell>;
}

function LoginForm({ onSwitch }) {
  let { register, handleSubmit, formState:{ errors } } = useForm();
  let { loginEmployee } = useAuth();
  let navigate = useNavigate();
  let location = useLocation();
  let [loading, setLoading] = useState(false);

  async function onSubmit(data) {
    setLoading(true);
    try {
      let res = await fetch(`${AUTH_BASE}/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      let body = await res.json();
      if (res.ok && body.data?.token) {
        loginEmployee(body.data.token, body.data);
        toast.success(`Welcome back, ${body.data.firstName}!`);
        // Navigate to attempted URL or employee dashboard
        let from = location.state?.from?.pathname;
        if (from && from.startsWith('/employee/')) {
          navigate(from, { replace: true });
        } else {
          navigate(`/employee/${body.data.id}`, { replace: true });
        }
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
      <h5>Sign in to Employee Portal</h5>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <label className="form-label" style={labelStyle}>Email</label>
          <input type="email" className={`form-control ${errors.email?'is-invalid':''}`} style={inputStyle} placeholder="you@company.com" {...register('email',{ required:'Email is required' })} />
          {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
        </div>
        <div className="mb-4">
          <label className="form-label" style={labelStyle}>Password</label>
          <input type="password" className={`form-control ${errors.password?'is-invalid':''}`} style={inputStyle} placeholder="enter password" {...register('password',{ required:'Password is required' })} />
          {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
        </div>
        <button className="btn btn-primary w-100" style={{ borderRadius:9, padding:'10px', fontWeight:600 }} disabled={loading}>
          {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in…</> : <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>}
        </button>
      </form>
      <p className="auth-switch">
        New employee? <button onClick={onSwitch} className="auth-link">Register here</button>
      </p>
    </>
  );
}

function RegisterForm({ onSwitch }) {
  let { register, handleSubmit, formState:{ errors }, watch } = useForm();
  let [loading, setLoading] = useState(false);

  async function onSubmit(data) {
    setLoading(true);
    try {
      let res = await fetch(`${AUTH_BASE}/employee/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName:data.firstName, lastName:data.lastName, email:data.email, password:data.password }),
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
      <h5>Create Employee Account</h5>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="row g-3 mb-2">
          <div className="col-6">
            <label className="form-label" style={labelStyle}>First Name</label>
            <input className={`form-control ${errors.firstName?'is-invalid':''}`} style={inputStyle} placeholder="First" {...register('firstName',{ required:'Required' })} />
            {errors.firstName && <div className="invalid-feedback">{errors.firstName.message}</div>}
          </div>
          <div className="col-6">
            <label className="form-label" style={labelStyle}>Last Name</label>
            <input className={`form-control ${errors.lastName?'is-invalid':''}`} style={inputStyle} placeholder="Last" {...register('lastName',{ required:'Required' })} />
            {errors.lastName && <div className="invalid-feedback">{errors.lastName.message}</div>}
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label" style={labelStyle}>Email</label>
          <input type="email" className={`form-control ${errors.email?'is-invalid':''}`} style={inputStyle} placeholder="you@company.com" {...register('email',{ required:'Email is required' })} />
          {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
        </div>
        <div className="mb-3">
          <label className="form-label" style={labelStyle}>Password</label>
          <input type="password" className={`form-control ${errors.password?'is-invalid':''}`} style={inputStyle} placeholder="Min 6 characters" {...register('password',{ required:'Password is required', minLength:{ value:6, message:'Minimum 6 characters' } })} />
          {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
        </div>
        <div className="mb-4">
          <label className="form-label" style={labelStyle}>Confirm Password</label>
          <input type="password" className={`form-control ${errors.confirmPassword?'is-invalid':''}`} style={inputStyle} placeholder="Repeat password" {...register('confirmPassword',{ required:'Please confirm', validate: v => v === watch('password') || 'Passwords do not match' })} />
          {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword.message}</div>}
        </div>
        <button className="btn btn-primary w-100" style={{ borderRadius:9, padding:'10px', fontWeight:600 }} disabled={loading}>
          {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Registering…</> : <><i className="bi bi-person-plus me-2"></i>Create Account</>}
        </button>
      </form>
      <p className="auth-switch">
        Already registered? <button onClick={onSwitch} className="auth-link">Sign in</button>
      </p>
    </>
  );
}

export default function EmployeeLoginPage() {
  let [mode, setMode] = useState('login');
  return (
    <AuthCard>
      {mode === 'login' ? <LoginForm onSwitch={() => setMode('register')} /> : <RegisterForm onSwitch={() => setMode('login')} />}
    </AuthCard>
  );
}

let labelStyle = { fontWeight:600, fontSize:'0.83rem', color:'var(--text-2)', marginBottom:4 };
let inputStyle  = { borderRadius:8, fontSize:'0.9rem' };
