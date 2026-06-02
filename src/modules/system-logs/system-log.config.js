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
    select: "system.log.read",
    list: "system.log.read",
    detail: "system.log.read",
    delete: "system.log.delete",
    bulkDelete: "system.log.delete",
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
