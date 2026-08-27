import React, { createContext, useContext, useState, useCallback } from 'react';

// ─────────────────────────────────────────────
//  Storage helpers
//  Two separate slots so admin and employee
//  sessions never collide.
// ─────────────────────────────────────────────
let ADMIN_TOKEN_KEY    = 'orgpluse_admin_token';
let ADMIN_USER_KEY     = 'orgpluse_admin_user';
let EMPLOYEE_TOKEN_KEY = 'orgpluse_employee_token';
let EMPLOYEE_USER_KEY  = 'orgpluse_employee_user';

function readJson(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}
function writeJson(key, val) {
  sessionStorage.setItem(key, JSON.stringify(val));
}
function clearKeys(...keys) {
  keys.forEach(k => sessionStorage.removeItem(k));
}

// ─────────────────────────────────────────────
//  Context
// ─────────────────────────────────────────────
let AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ── Admin state ──────────────────────────
  let [adminToken, setAdminToken] = useState(() => readJson(ADMIN_TOKEN_KEY));
  let [adminUser,  setAdminUser]  = useState(() => readJson(ADMIN_USER_KEY));

  // ── Employee state ───────────────────────
  let [employeeToken, setEmployeeToken] = useState(() => readJson(EMPLOYEE_TOKEN_KEY));
  let [employeeUser,  setEmployeeUser]  = useState(() => readJson(EMPLOYEE_USER_KEY));

  // ── Admin helpers ────────────────────────
  let loginAdmin = useCallback((token, user) => {
    writeJson(ADMIN_TOKEN_KEY, token);
    writeJson(ADMIN_USER_KEY,  user);
    setAdminToken(token);
    setAdminUser(user);
  }, []);

  let logoutAdmin = useCallback(() => {
    clearKeys(ADMIN_TOKEN_KEY, ADMIN_USER_KEY);
    setAdminToken(null);
    setAdminUser(null);
  }, []);

  // ── Employee helpers ─────────────────────
  let loginEmployee = useCallback((token, user) => {
    writeJson(EMPLOYEE_TOKEN_KEY, token);
    writeJson(EMPLOYEE_USER_KEY,  user);
    setEmployeeToken(token);
    setEmployeeUser(user);
  }, []);

  let logoutEmployee = useCallback(() => {
    clearKeys(EMPLOYEE_TOKEN_KEY, EMPLOYEE_USER_KEY);
    setEmployeeToken(null);
    setEmployeeUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      // admin
      adminToken, adminUser, loginAdmin, logoutAdmin,
      isAdminAuth: !!adminToken,
      // employee
      employeeToken, employeeUser, loginEmployee, logoutEmployee,
      isEmployeeAuth: !!employeeToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Convenience hook ─────────────────────────
export function useAuth() {
  let ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
