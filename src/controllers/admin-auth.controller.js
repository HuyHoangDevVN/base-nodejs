"use strict";

const crypto = require("node:crypto");
const { authUserRepository, passwordService, auditLogService } = require("../modules/auth");
const { AuthorizationRepository } = require("../modules/authorization/repositories/authorization.repository");
const { sendSuccess } = require("../utils/apiResponse");
const { toPagination } = require("../shared/utils/pagination");
const { toPublicAuthUser } = require("../modules/auth/mappers/auth-user.mapper");
const { AuthAuditAction, AccountStatus } = require("../constants/auth");
const { AppError } = require("../errors/AppError");

const authorizationRepository = new AuthorizationRepository();

class AdminAuthController {
  getContext = (req) => ({
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  listUsers = async (req, res) => {
    const { count, rows } = await authUserRepository.list(req.validated.query);
    return sendSuccess(res, {
      message: "Auth users retrieved",
      data: {
        items: rows.map(toPublicAuthUser),
        pagination: toPagination({
          page: req.validated.query.page,
          limit: req.validated.query.limit,
          totalItems: count,
        }),
      },
    });
  };

  getUserById = async (req, res) => {
    const user = await authUserRepository.findById(req.validated.params.id, { attributes: { exclude: ["passwordHash"] } });
    if (!user) throw new AppError("Auth user not found", { status: 404, code: "AUTH_USER_NOT_FOUND" });
    return sendSuccess(res, { message: "Auth user retrieved", data: toPublicAuthUser(user) });
  };

  updateUserStatus = async (req, res) => {
    const { id } = req.validated.params;
    const { status, reason } = req.validated.body;
    await authUserRepository.updateById(id, { status });
    await auditLogService.record({
      actorUserId: req.auth.id,
      targetUserId: id,
      action: AuthAuditAction.UPDATE_STATUS,
      resourceType: "auth_user",
      resourceId: id,
      after: { status, reason },
      ...this.getContext(req),
    });
    return sendSuccess(res, { message: "Auth user status updated", data: { id, status } });
  };

  lockUser = async (req, res) => {
    req.validated.body = { status: AccountStatus.LOCKED, reason: "locked_by_admin" };
    return this.updateUserStatus(req, res);
  };

  unlockUser = async (req, res) => {
    req.validated.body = { status: AccountStatus.ACTIVE, reason: "unlocked_by_admin" };
    return this.updateUserStatus(req, res);
  };

  resetPassword = async (req, res) => {
    const newPassword = crypto.randomBytes(12).toString("base64url");
    const passwordHash = await passwordService.hash(`${newPassword}A1`);
    await authUserRepository.updateById(req.validated.params.id, {
      passwordHash,
      mustChangePassword: true,
    });
    await auditLogService.record({
      actorUserId: req.auth.id,
      targetUserId: req.validated.params.id,
      action: AuthAuditAction.CHANGE_PASSWORD,
      resourceType: "auth_user",
      resourceId: req.validated.params.id,
      ...this.getContext(req),
    });
    return sendSuccess(res, {
      message: "Auth user password reset",
      data: { mustChangePassword: true, temporaryPassword: `${newPassword}A1` },
    });
  };

  listRoles = async (req, res) => sendSuccess(res, {
    message: "Roles retrieved",
    data: { items: await authorizationRepository.listRoles() },
  });

  listPermissions = async (req, res) => sendSuccess(res, {
    message: "Permissions retrieved",
    data: { items: await authorizationRepository.listPermissions() },
  });

  listPermissionGroups = async (req, res) => sendSuccess(res, {
    message: "Permission groups retrieved",
    data: { items: await authorizationRepository.listPermissionGroups() },
  });

  assignRoles = async (req, res) => {
    const { id } = req.validated.params;
    const { roleIds, expiresAt, reason } = req.validated.body;
    await authorizationRepository.assignRoles({ userId: id, roleIds, expiresAt, assignedBy: req.auth.id });
    await auditLogService.record({
      actorUserId: req.auth.id,
      targetUserId: id,
      action: AuthAuditAction.ASSIGN_ROLE,
      resourceType: "auth_user",
      resourceId: id,
      after: { roleIds, expiresAt, reason },
      ...this.getContext(req),
    });
    return sendSuccess(res, { message: "Roles assigned", data: { userId: id, roleIds } });
  };
}

module.exports = new AdminAuthController();
