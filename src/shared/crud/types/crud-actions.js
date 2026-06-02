"use strict";

const CrudActions = Object.freeze({
  SELECT: "select",
  LIST: "list",
  DETAIL: "detail",
  CREATE: "create",
  BULK_CREATE: "bulkCreate",
  UPDATE: "update",
  BULK_UPDATE: "bulkUpdate",
  DELETE: "delete",
  BULK_DELETE: "bulkDelete",
  RESTORE: "restore",
  BULK_RESTORE: "bulkRestore",
});

const WriteActions = new Set([
  CrudActions.CREATE,
  CrudActions.BULK_CREATE,
  CrudActions.UPDATE,
  CrudActions.BULK_UPDATE,
  CrudActions.DELETE,
  CrudActions.BULK_DELETE,
  CrudActions.RESTORE,
  CrudActions.BULK_RESTORE,
]);

module.exports = { CrudActions, WriteActions };
