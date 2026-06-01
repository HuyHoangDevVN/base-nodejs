"use strict";

const { Roles } = require("../../../constants/roles");
const { ForbiddenError } = require("../../../shared/errors/forbidden-error");

class CohortPolicy {
  canRead() {
    return true;
  }

  assertCanRead() {
    return true;
  }

  assertCanManage(actor) {
    const adminRole = actor?.role === Roles.ADMIN || actor?.roles?.some((role) => ["ADMIN", "SUPER_ADMIN"].includes(role));
    const canManage = actor?.permissions?.includes("cohort.manage");
    if (!actor || (!adminRole && !canManage)) {
      throw new ForbiddenError();
    }
    return true;
  }
}

module.exports = { CohortPolicy };
