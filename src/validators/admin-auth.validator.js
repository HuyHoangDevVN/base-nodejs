"use strict";

const { z } = require("zod");
const { AccountStatus } = require("../constants/auth");

const uuidParams = z.object({
  id: z.string().uuid(),
});

const roleParams = z.object({
  id: z.string().uuid(),
  roleId: z.string().uuid().optional(),
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

const directPermissionBody = z.object({
  permissionIds: z.array(z.string().uuid()).min(1).max(50),
  expiresAt: z.coerce.date().optional(),
  reason: z.string().trim().min(1).max(500),
});

module.exports = {
  uuidParams,
  roleParams,
  userListQuery,
  updateStatusBody,
  assignRolesBody,
  directPermissionBody,
};
