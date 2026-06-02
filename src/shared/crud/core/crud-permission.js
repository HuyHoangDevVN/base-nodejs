"use strict";

const { forbidden } = require("./crud-errors");

const actorPermissions = (ctx) => new Set([...(ctx.permissions ?? []), ...(ctx.user?.permissions ?? [])]);

const canByRequirement = (ctx, requirement) => {
  if (!requirement) return true;
  if (ctx.roles?.includes("SUPER_ADMIN")) return true;
  const permissions = actorPermissions(ctx);
  if (typeof requirement === "string") return permissions.has(requirement);
  if (Array.isArray(requirement)) return requirement.some((code) => permissions.has(code));
  if (requirement.any) return requirement.any.some((code) => permissions.has(code));
  if (requirement.all) return requirement.all.every((code) => permissions.has(code));
  return false;
};

const assertCrudPermission = (config, action, ctx) => {
  if (config.public === true && !config.permissions?.[action]) return;
  const requirement = config.permissions?.[action];
  if (!requirement) {
    throw forbidden(`Permission for ${config.resource}.${action} is not configured`);
  }
  if (!canByRequirement(ctx, requirement)) {
    throw forbidden();
  }
};

module.exports = {
  assertCrudPermission,
  canByRequirement,
};
