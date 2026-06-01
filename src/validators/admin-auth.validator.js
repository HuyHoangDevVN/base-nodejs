"use strict";

const { z } = require("zod");
const { AccountStatus } = require("../constants/auth");

const uuidParams = z.object({
  id: z.string().uuid(),
});

const userSessionParams = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
});

const roleParams = z.object({
  id: z.string().uuid(),
  roleId: z.string().uuid().optional(),
});

const permissionParams = z.object({
  id: z.string().uuid(),
  permissionId: z.string().uuid().optional(),
});

const groupParams = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid().optional(),
  permissionId: z.string().uuid().optional(),
});

const userListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).default(""),
  status: z.nativeEnum(AccountStatus).optional(),
});

const updateStatusBody = z.object({
  status: z.nativeEnum(AccountStatus),
  reason: z.string().trim().min(1).max(500).optional(),
});

const assignRolesBody = z.object({
  roleIds: z.array(z.string().uuid()).min(1).max(50),
  expiresAt: z.coerce.date().optional(),
  reason: z.string().trim().max(500).optional(),
});

const idList = (field) => z.object({
  [field]: z.array(z.string().uuid()).min(1).max(100),
});

const roleBody = z.object({
  code: z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,99}$/),
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

const permissionCode = z.string().trim().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/);
const permissionBody = z.object({
  code: permissionCode,
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  module: z.string().trim().min(1).max(80),
  resource: z.string().trim().min(1).max(100),
  action: z.string().trim().min(1).max(80),
  apiMethod: z.string().trim().max(16).optional().nullable(),
  apiPathPattern: z.string().trim().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
});

const permissionGroupBody = z.object({
  code: z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,99}$/),
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  module: z.string().trim().min(1).max(80),
  isActive: z.boolean().optional(),
});

const permissionListQuery = z.object({
  module: z.string().trim().max(80).optional(),
  resource: z.string().trim().max(100).optional(),
  action: z.string().trim().max(80).optional(),
  isActive: z.coerce.boolean().optional(),
});

const directPermissionBody = z.object({
  permissionIds: z.array(z.string().uuid()).min(1).max(50),
  expiresAt: z.coerce.date().optional(),
  reason: z.string().trim().min(1).max(500),
});

module.exports = {
  uuidParams,
  userSessionParams,
  roleParams,
  permissionParams,
  groupParams,
  userListQuery,
  permissionListQuery,
  updateStatusBody,
  assignRolesBody,
  roleBody,
  permissionBody,
  permissionGroupBody,
  assignPermissionGroupsBody: idList("groupIds").extend({
    expiresAt: z.coerce.date().optional(),
    reason: z.string().trim().max(500).optional(),
  }),
  assignGroupPermissionsBody: idList("permissionIds"),
  assignRolePermissionGroupsBody: idList("groupIds"),
  assignRolePermissionsBody: idList("permissionIds"),
  directPermissionBody,
};
