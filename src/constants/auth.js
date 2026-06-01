"use strict";

const AccountStatus = Object.freeze({
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  ACTIVE: "ACTIVE",
  LOCKED: "LOCKED",
  DEACTIVATED: "DEACTIVATED",
  SOFT_DELETED: "SOFT_DELETED",
});

const SessionStatus = Object.freeze({
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED",
});

const AuthAuditAction = Object.freeze({
  REGISTER: "auth.register",
  LOGIN_SUCCESS: "auth.login_success",
  LOGIN_FAILED: "auth.login_failed",
  REFRESH: "auth.refresh",
  REFRESH_REUSE_DETECTED: "auth.refresh_reuse_detected",
  LOGOUT: "auth.logout",
  LOGOUT_ALL: "auth.logout_all",
  CHANGE_PASSWORD: "auth.change_password",
  LOCK_ACCOUNT: "auth.account.lock",
  UNLOCK_ACCOUNT: "auth.account.unlock",
  UPDATE_STATUS: "auth.account.update_status",
  ASSIGN_ROLE: "auth.role.assign",
  ASSIGN_PERMISSION_GROUP: "auth.permission_group.assign",
  ASSIGN_DIRECT_PERMISSION: "auth.permission.assign_direct",
});

const SystemRole = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  HR_MANAGER: "HR_MANAGER",
  HR_STAFF: "HR_STAFF",
  EMPLOYEE: "EMPLOYEE",
  AUDITOR: "AUDITOR",
});

module.exports = {
  AccountStatus,
  SessionStatus,
  AuthAuditAction,
  SystemRole,
};
