"use strict";

const DEFAULT_PERMISSIONS = [
  ["auth.user.read", "Read Auth Users", "auth", "user", "read", "GET", "/api/v1/admin/auth/users"],
  ["auth.user.create", "Create Auth User", "auth", "user", "create", "POST", "/api/v1/admin/auth/users"],
  ["auth.user.update", "Update Auth User", "auth", "user", "update", "PATCH", "/api/v1/admin/auth/users/:id"],
  ["auth.user.update_status", "Update User Status", "auth", "user", "update_status", "PATCH", "/api/v1/admin/auth/users/:id/status"],
  ["auth.user.lock", "Lock User", "auth", "user", "lock", "POST", "/api/v1/admin/auth/users/:id/lock"],
  ["auth.user.unlock", "Unlock User", "auth", "user", "unlock", "POST", "/api/v1/admin/auth/users/:id/unlock"],
  ["auth.user.reset_password", "Reset User Password", "auth", "user", "reset_password", "POST", "/api/v1/admin/auth/users/:id/reset-password"],
  ["auth.session.read", "Read Sessions", "auth", "session", "read", "GET", "/api/v1/auth/sessions"],
  ["auth.session.revoke", "Revoke Sessions", "auth", "session", "revoke", "POST", "/api/v1/auth/logout-all"],
  ["auth.role.read", "Read Roles", "auth", "role", "read", "GET", "/api/v1/admin/auth/roles"],
  ["auth.role.create", "Create Role", "auth", "role", "create", "POST", "/api/v1/admin/auth/roles"],
  ["auth.role.update", "Update Role", "auth", "role", "update", "PATCH", "/api/v1/admin/auth/roles/:id"],
  ["auth.role.delete", "Delete Role", "auth", "role", "delete", "DELETE", "/api/v1/admin/auth/roles/:id"],
  ["auth.role.assign", "Assign Role", "auth", "role", "assign", "POST", "/api/v1/admin/auth/users/:id/roles"],
  ["auth.permission.read", "Read Permissions", "auth", "permission", "read", "GET", "/api/v1/admin/auth/permissions"],
  ["auth.permission.create", "Create Permission", "auth", "permission", "create", "POST", "/api/v1/admin/auth/permissions"],
  ["auth.permission.update", "Update Permission", "auth", "permission", "update", "PATCH", "/api/v1/admin/auth/permissions/:id"],
  ["auth.permission.delete", "Delete Permission", "auth", "permission", "delete", "DELETE", "/api/v1/admin/auth/permissions/:id"],
  ["auth.permission.assign_direct", "Assign Direct Permission", "auth", "permission", "assign_direct", "POST", "/api/v1/admin/auth/users/:id/permissions"],
  ["auth.permission_group.read", "Read Permission Groups", "auth", "permission_group", "read", "GET", "/api/v1/admin/auth/permission-groups"],
  ["auth.permission_group.create", "Create Permission Group", "auth", "permission_group", "create", "POST", "/api/v1/admin/auth/permission-groups"],
  ["auth.permission_group.update", "Update Permission Group", "auth", "permission_group", "update", "PATCH", "/api/v1/admin/auth/permission-groups/:id"],
  ["auth.permission_group.delete", "Delete Permission Group", "auth", "permission_group", "delete", "DELETE", "/api/v1/admin/auth/permission-groups/:id"],
  ["auth.permission_group.assign", "Assign Permission Group", "auth", "permission_group", "assign", "POST", "/api/v1/admin/auth/users/:id/permission-groups"],
  ["admin.system_logs.read", "Read System Logs", "admin", "system_logs", "read", "GET", "/api/v1/admin/system-logs"],
  ["admin.system_health.read", "Read System Health", "admin", "system_health", "read", "GET", "/api/v1/ready"],
  ["admin.settings.read", "Read Settings", "admin", "settings", "read", "GET", "/api/v1/admin/settings"],
  ["admin.settings.update", "Update Settings", "admin", "settings", "update", "PATCH", "/api/v1/admin/settings"],
  ["hrm.employee.read", "Read Employees", "hrm", "employee", "read", "GET", "/api/v1/employees"],
  ["hrm.employee.create", "Create Employee", "hrm", "employee", "create", "POST", "/api/v1/employees"],
  ["hrm.employee.update", "Update Employee", "hrm", "employee", "update", "PATCH", "/api/v1/employees/:id"],
  ["hrm.employee.delete", "Delete Employee", "hrm", "employee", "delete", "DELETE", "/api/v1/employees/:id"],
  ["hrm.account.provision", "Provision Account", "hrm", "account", "provision", "POST", "/api/v1/accounts/provision"],
  ["cohort.read", "Read Cohorts", "academic", "cohort", "read", "GET", "/api/v1/cohorts"],
  ["cohort.manage", "Manage Cohorts", "academic", "cohort", "manage", "POST", "/api/v1/cohorts"],
];

const DEFAULT_ROLES = [
  ["SUPER_ADMIN", "Super Admin", "Full system access"],
  ["ADMIN", "Admin", "Common administration access"],
  ["HR_MANAGER", "HR Manager", "HR management and account provisioning"],
  ["HR_STAFF", "HR Staff", "HR operational access"],
  ["EMPLOYEE", "Employee", "Basic employee access"],
  ["AUDITOR", "Auditor", "Read audit and report access"],
];

const DEFAULT_PERMISSION_GROUPS = [
  ["AUTH_USER_MANAGEMENT", "Auth User Management", "auth", ["auth.user.read", "auth.user.create", "auth.user.update", "auth.user.update_status", "auth.user.lock", "auth.user.unlock", "auth.user.reset_password", "auth.session.read", "auth.session.revoke"]],
  ["AUTH_ROLE_MANAGEMENT", "Role Management", "auth", ["auth.role.read", "auth.role.create", "auth.role.update", "auth.role.delete", "auth.role.assign"]],
  ["AUTH_PERMISSION_MANAGEMENT", "Permission Management", "auth", ["auth.permission.read", "auth.permission.create", "auth.permission.update", "auth.permission.delete", "auth.permission.assign_direct", "auth.permission_group.read", "auth.permission_group.create", "auth.permission_group.update", "auth.permission_group.delete", "auth.permission_group.assign"]],
  ["ADMIN_MONITORING", "Admin Monitoring", "admin", ["admin.system_logs.read", "admin.system_health.read", "admin.settings.read", "admin.settings.update"]],
  ["HRM_EMPLOYEE_MANAGEMENT", "HRM Employee Management", "hrm", ["hrm.employee.read", "hrm.employee.create", "hrm.employee.update", "hrm.employee.delete", "hrm.account.provision"]],
  ["ACADEMIC_COHORT_MANAGEMENT", "Academic Cohort Management", "academic", ["cohort.read", "cohort.manage"]],
];

const ROLE_PERMISSION_GROUPS = {
  SUPER_ADMIN: ["AUTH_USER_MANAGEMENT", "AUTH_ROLE_MANAGEMENT", "AUTH_PERMISSION_MANAGEMENT", "ADMIN_MONITORING", "HRM_EMPLOYEE_MANAGEMENT", "ACADEMIC_COHORT_MANAGEMENT"],
  ADMIN: ["AUTH_USER_MANAGEMENT", "AUTH_ROLE_MANAGEMENT", "ADMIN_MONITORING", "ACADEMIC_COHORT_MANAGEMENT"],
  HR_MANAGER: ["HRM_EMPLOYEE_MANAGEMENT", "ACADEMIC_COHORT_MANAGEMENT"],
  HR_STAFF: ["HRM_EMPLOYEE_MANAGEMENT", "ACADEMIC_COHORT_MANAGEMENT"],
  AUDITOR: ["ADMIN_MONITORING"],
};

module.exports = {
  DEFAULT_PERMISSIONS,
  DEFAULT_PERMISSION_GROUPS,
  DEFAULT_ROLES,
  ROLE_PERMISSION_GROUPS,
};
