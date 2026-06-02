"use strict";

const { AuthorizationAdminService } = require("../src/modules/authorization/services/authorization-admin.service");

const makeModels = ({ auditFails = false } = {}) => {
  const transaction = jest.fn(async (work) => work("tx"));
  return {
    sequelize: { transaction },
    UserRole: { upsert: jest.fn().mockResolvedValue([{}, true]), destroy: jest.fn().mockResolvedValue(1) },
    UserPermission: { upsert: jest.fn().mockResolvedValue([{}, true]), destroy: jest.fn().mockResolvedValue(1) },
    UserPermissionGroup: { upsert: jest.fn().mockResolvedValue([{}, true]), destroy: jest.fn().mockResolvedValue(1) },
    RolePermission: { findOrCreate: jest.fn().mockResolvedValue([{}, true]) },
    RolePermissionGroup: { findOrCreate: jest.fn().mockResolvedValue([{}, true]) },
    PermissionGroupPermission: { findOrCreate: jest.fn().mockResolvedValue([{}, true]) },
    Role: { findByPk: jest.fn().mockResolvedValue({ code: "ADMIN" }) },
    AuthAuditLog: {
      create: auditFails ? jest.fn().mockRejectedValue(new Error("audit failed")) : jest.fn().mockResolvedValue({}),
    },
  };
};

const ctx = { actorUserId: "actor-1", requestId: "req-1" };

describe("AuthorizationAdminService", () => {
  test("assignRoles writes assignment and audit in a transaction then invalidates cache", async () => {
    const models = makeModels();
    const permissionResolver = { invalidate: jest.fn() };
    const service = new AuthorizationAdminService({ models, permissionResolver });

    await expect(service.assignRoles({ userId: "user-1", roleIds: ["role-1"], reason: "approved", ctx })).resolves.toEqual({
      userId: "user-1",
      roleIds: ["role-1"],
    });

    expect(models.sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(models.UserRole.upsert).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1", roleId: "role-1" }), { transaction: "tx" });
    expect(models.AuthAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ action: "auth.role.assign" }), { transaction: "tx" });
    expect(permissionResolver.invalidate).toHaveBeenCalledWith("user-1");
  });

  test("audit failure rejects assignment flow before cache invalidation", async () => {
    const models = makeModels({ auditFails: true });
    const permissionResolver = { invalidate: jest.fn() };
    const service = new AuthorizationAdminService({ models, permissionResolver });

    await expect(service.assignUserPermissions({
      userId: "user-1",
      permissionIds: ["permission-1"],
      reason: "temporary access",
      ctx,
    })).rejects.toThrow(/audit failed/);

    expect(permissionResolver.invalidate).not.toHaveBeenCalled();
  });

  test("direct permission assignment requires reason", async () => {
    const service = new AuthorizationAdminService({ models: makeModels(), permissionResolver: { invalidate: jest.fn() } });

    await expect(service.assignUserPermissions({
      userId: "user-1",
      permissionIds: ["permission-1"],
      reason: "",
      ctx,
    })).rejects.toMatchObject({ code: "DIRECT_PERMISSION_REASON_REQUIRED" });
  });
});
