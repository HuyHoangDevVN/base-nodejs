"use strict";

const { z } = require("zod");

const systemLogCreateSchema = z.object({
  level: z.enum(["info", "warn", "error"]),
  message: z.string().trim().min(1).max(500),
  source: z.string().trim().max(100).optional(),
  createdAt: z.coerce.date().optional(),
});

const systemLogResourceConfig = {
  resource: "system-logs",
  displayName: "System log",
  storage: {
    type: "mongo",
    collection: "system_logs",
    primaryKey: "id",
    idType: "objectId",
  },
  permissions: {
    select: "admin.system_logs.read",
    list: "admin.system_logs.read",
    detail: "admin.system_logs.read",
    delete: "admin.system_logs.delete",
    bulkDelete: "admin.system_logs.delete",
  },
  actions: {
    create: false,
    bulkCreate: false,
    update: false,
    bulkUpdate: false,
    restore: false,
    bulkRestore: false,
  },
  fields: {
    readable: ["id", "level", "message", "source", "createdAt"],
    selectable: ["id", "message", "level"],
    searchable: ["message", "source"],
    sortable: ["createdAt", "level"],
    filterable: {
      level: ["eq", "in"],
      source: ["eq", "contains", "startsWith"],
      createdAt: ["gte", "lte"],
    },
    create: ["level", "message", "source", "createdAt"],
    update: [],
  },
  validation: {
    createSchema: systemLogCreateSchema,
    rejectUnknownFields: true,
  },
  softDelete: {
    enabled: false,
  },
  audit: {
    enabled: true,
    resourceType: "system_log",
    redactFields: ["message"],
  },
  limits: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxBulkSize: 200,
    maxSelectSize: 25,
  },
};

module.exports = { systemLogResourceConfig };
