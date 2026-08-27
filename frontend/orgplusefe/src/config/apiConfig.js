const API_URL = process.env.REACT_APP_API_URLS || "http://localhost:8080";

export let ADMIN_BASE = `${API_URL}/api/v1/admin`;

export let EMPLOYEE_BASE = (employeeId) =>
  `${API_URL}/api/v1/employee/${employeeId}`;

