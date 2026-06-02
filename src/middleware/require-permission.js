"use strict";

module.exports = {
  requirePermission: require("../middlewares/auth").requirePermission,
  requireAnyPermission: require("../middlewares/auth").requireAnyPermission,
  requireAllPermissions: require("../middlewares/auth").requireAllPermissions,
};
