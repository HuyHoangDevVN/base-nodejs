"use strict";

const toPlain = (entity) => (entity?.get ? entity.get({ plain: true }) : entity);

const toPublicAuthUser = (entity) => {
  const user = toPlain(entity);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    username: user.username ?? null,
    employeeCode: user.employeeCode ?? null,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    departmentName: user.departmentName ?? null,
    orgUnit: user.orgUnit ?? null,
    status: user.status,
    mustChangePassword: Boolean(user.mustChangePassword),
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };
};

const toRoleSummary = (role) => {
  const item = toPlain(role);
  return item ? { id: item.id, code: item.code, name: item.name } : null;
};

const toPermissionGroupSummary = (group) => {
  const item = toPlain(group);
  return item ? { id: item.id, code: item.code, name: item.name } : null;
};

module.exports = {
  toPublicAuthUser,
  toRoleSummary,
  toPermissionGroupSummary,
};
