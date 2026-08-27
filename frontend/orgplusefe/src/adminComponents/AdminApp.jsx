import React from 'react';
import AdminNavbar from './navbar/AdminNavbar';
import { Outlet } from 'react-router-dom';

export default function AdminApp() {
  return (
    <>
      <AdminNavbar />
      <div className="hrms-main">
        <Outlet />
      </div>
    </>
  );
}
