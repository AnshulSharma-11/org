import React from 'react';
import UserNavbar from './navbar/UserNavbar';
import { Outlet } from 'react-router-dom';

export default function UserHome() {
  return (
    <>
      <UserNavbar />
      <div style={{ padding: '24px' }}>
        <Outlet />
      </div>
    </>
  );
}
