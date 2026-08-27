import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ToastContainer, Zoom } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './hrms.css';

// ── Auth
import { AuthProvider }    from './auth/AuthContext';
import ProtectedRoute      from './auth/ProtectedRoute';
import AdminLoginPage      from './auth/pages/AdminLoginPage';
import EmployeeLoginPage   from './auth/pages/EmployeeLoginPage';

// ── Admin imports
import AdminApp            from './adminComponents/AdminApp';
import AdminDashboard      from './adminComponents/dashboard/AdminDashboard';
import FetchBranches       from './adminComponents/branch/FetchBranches';
import AddBranch           from './adminComponents/branch/AddBranch';
import UpdateBranch        from './adminComponents/branch/UpdateBranch';
import FetchDesignations   from './adminComponents/designation/FetchDesignations';
import AddDesignation      from './adminComponents/designation/AddDesignation';
import UpdateDesignation   from './adminComponents/designation/UpdateDesignation';
import FetchDepartments    from './adminComponents/department/FetchDepartments';
import AddDepartment       from './adminComponents/department/AddDepartment';
import UpdateDepartment    from './adminComponents/department/UpdateDepartment';
import FetchEmployees      from './adminComponents/employee/FetchEmployees';
import AddEmployee         from './adminComponents/employee/AddEmployee';
import UpdateEmployee      from './adminComponents/employee/UpdateEmployee';
import FetchTimeRecords    from './adminComponents/timerecord/FetchTimeRecords';
import FetchLeaves         from './adminComponents/leave/FetchLeaves';
import AddLeave            from './adminComponents/leave/AddLeave';
import UpdateLeave         from './adminComponents/leave/UpdateLeave';
import FetchPayroll        from './adminComponents/payroll/FetchPayroll';
import AddPayrollRun       from './adminComponents/payroll/AddPayrollRun';
import FetchPerformance    from './adminComponents/performance/FetchPerformance';
import AddPerformanceReview from './adminComponents/performance/AddPerformanceReview';
import UpdatePerformance   from './adminComponents/performance/UpdatePerformance';
import FetchHelp           from './adminComponents/help/FetchHelp';
import UpdateHelp          from './adminComponents/help/UpdateHelp';
import FetchProjects       from './adminComponents/project/FetchProjects';
import AddProject          from './adminComponents/project/AddProject';

// ── Employee imports
import UserHome            from './userComponents/UserHome';
import MyProjects          from './userComponents/project/MyProjects';
import EmployeeDashboard   from './userComponents/dashboard/EmployeeDashboard';
import ViewProfile         from './userComponents/profile/ViewProfile';
import MyDocuments         from './userComponents/documents/MyDocuments';
import ApplyLeave          from './userComponents/leave/ApplyLeave';
import MyLeaves            from './userComponents/leave/MyLeaves';
import RaiseHelpRequest    from './userComponents/help/RaiseHelpRequest';
import MyPayroll           from './userComponents/payroll/MyPayroll';
import MyAttendance        from './userComponents/attendance/MyAttendance';
import Combinelogin from './auth/pages/Combinelogin';

let router = createBrowserRouter([
  { path: '/combinelogin' , element:<Combinelogin/> },
  { path: '/employee/login', element: <EmployeeLoginPage /> },
  { path: '/admin/login',    element: <AdminLoginPage /> },
  

  {
    path: '/admin',
    element: (
      <ProtectedRoute role="admin">
        <AdminApp />
      </ProtectedRoute>
    ),
    children: [
      { index: true,                         element: <AdminDashboard /> },
      { path: 'branches',                    element: <FetchBranches /> },
      { path: 'branches/add',                element: <AddBranch /> },
      { path: 'branches/update/:id',         element: <UpdateBranch /> },
      { path: 'designations',                element: <FetchDesignations /> },
      { path: 'designations/add',            element: <AddDesignation /> },
      { path: 'designations/update/:id',     element: <UpdateDesignation /> },
      { path: 'departments',                 element: <FetchDepartments /> },
      { path: 'departments/add',             element: <AddDepartment /> },
      { path: 'departments/update/:id',      element: <UpdateDepartment /> },
      { path: 'employees',                   element: <FetchEmployees /> },
      { path: 'employees/add',               element: <AddEmployee /> },
      { path: 'employees/update/:id',        element: <UpdateEmployee /> },
      { path: 'time-records',                element: <FetchTimeRecords /> },
      { path: 'leaves',                      element: <FetchLeaves /> },
      { path: 'leaves/add',                  element: <AddLeave /> },
      { path: 'leaves/update/:id',           element: <UpdateLeave /> },
      { path: 'payroll',                     element: <FetchPayroll /> },
      { path: 'payroll/add',                 element: <AddPayrollRun /> },
      { path: 'performance',                 element: <FetchPerformance /> },
      { path: 'performance/add',             element: <AddPerformanceReview /> },
      { path: 'performance/update/:id',      element: <UpdatePerformance /> },
      { path: 'help',                        element: <FetchHelp /> },
      { path: 'help/update/:id',             element: <UpdateHelp /> },
      { path: 'projects',                    element: <FetchProjects /> },
      { path: 'projects/add',               element: <AddProject /> },
    ],
  },

  {
    path: '/employee/:employeeId',
    element: (
      <ProtectedRoute role="employee">
        <UserHome />
      </ProtectedRoute>
    ),
    children: [
      { index: true,           element: <EmployeeDashboard /> },
      { path: 'profile',       element: <ViewProfile /> },
      { path: 'documents',     element: <MyDocuments /> },
      { path: 'leaves',        element: <MyLeaves /> },
      { path: 'leaves/apply',  element: <ApplyLeave /> },
      { path: 'help/raise',    element: <RaiseHelpRequest /> },
      { path: 'payroll',       element: <MyPayroll /> },
      { path: 'attendance',    element: <MyAttendance /> },
      { path: 'projects',      element: <MyProjects /> },
    ],
  },

  { path: '/', element: <Navigate to="/combinelogin" replace /> }, // home page link where it start first once you start the serve this link goes

  {
    path: '*',
    element: (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, fontFamily:'sans-serif', color:'#64748b' }}>
        <i className="bi bi-exclamation-circle" style={{ fontSize:'3rem', color:'#cbd5e1' }}></i>
        <h2 style={{ margin:0, color:'#0f172a' }}>404 — Page Not Found</h2>
        <a href="/combinelogin" style={{ color:'#2563eb', textDecoration:'none', fontWeight:600 }}>← Back to Login</a>
      </div>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <RouterProvider router={router} />
    <ToastContainer position="top-right" autoClose={2000} 
    hideProgressBar={false} newestOnTop={false} 
    closeOnClick={false} rtl={false} 
    pauseOnFocusLoss draggable pauseOnHover theme="light" transition={Zoom} />
  </AuthProvider>
);
