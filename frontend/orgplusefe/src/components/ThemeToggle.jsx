import React from 'react';
import { useTheme } from '../theme/ThemeContext';

/**
 * Light / dark switch.
 *  <ThemeToggle />                  → round icon button
 *  <ThemeToggle onDark />           → same, styled for dark bars (sidebar / navbar)
 *  <ThemeToggle variant="row" />    → full-width sidebar row with a text label
 */
export default function ThemeToggle({ variant = 'icon', onDark = false, className = '' }) {
  let { isDark, toggleTheme } = useTheme();
  let label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  let icon  = isDark ? 'bi-sun-fill' : 'bi-moon-stars-fill';

  if (variant === 'row') {
    return (
      <button type="button" className={`theme-row ${className}`} onClick={toggleTheme} aria-label={label} title={label}>
        <i className={`bi ${icon}`}></i> {isDark ? 'Light mode' : 'Dark mode'}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`theme-toggle ${onDark ? 'on-dark' : ''} ${className}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
    >
      <i className={`bi ${icon}`}></i>
    </button>
  );
}
