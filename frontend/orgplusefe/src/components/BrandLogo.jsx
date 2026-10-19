import React from 'react';
import logo from '../assets/logo.png';
import logoMark from '../assets/logo-mark.png';

/** Full ORGPLUS wordmark (sits on a white plate automatically in dark mode). */
export default function BrandLogo({ height, className = '', style }) {
  return (
    <img
      src={logo}
      alt="ORGPLUS — Employee Management System"
      className={`brand-logo ${className}`}
      style={{ ...(height ? { height } : {}), ...style }}
    />
  );
}

/** Square emblem icon (works on any background). */
export function BrandMark({ size, className = '', style }) {
  return (
    <img
      src={logoMark}
      alt="ORGPLUS"
      className={`brand-mark ${className}`}
      style={{ ...(size ? { width: size, height: size } : {}), ...style }}
    />
  );
}
