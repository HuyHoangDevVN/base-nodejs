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
    if (!actor || actor.role !== Roles.ADMIN) {
      throw new ForbiddenError();
    }
    return true;
  }
}

module.exports = { CohortPolicy };
