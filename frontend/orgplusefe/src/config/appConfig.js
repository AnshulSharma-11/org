// ─────────────────────────────────────────────────────────────────────────────
//  ORGPLUSEfrontend — Application Configuration
//
//  Override any value with a REACT_APP_* environment variable in .env so
//  deployments never require source changes.
//  Example .env line:  REACT_APP_LEAVE_QUOTA=24
// ─────────────────────────────────────────────────────────────────────────────

/** Annual leave quota per employee (days). */
export let DEFAULT_LEAVE_QUOTA =
  parseInt(process.env.REACT_APP_LEAVE_QUOTA, 10) || 20;
