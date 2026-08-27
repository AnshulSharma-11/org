export let ADMIN_BASE = "http://localhost:8080/api/v1/admin";

// Scoped employee self-service base — /api/v1/employee/:id
export let EMPLOYEE_BASE = (employeeId) =>
  `http://localhost:8080/api/v1/employee/${employeeId}`;
