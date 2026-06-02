"use strict";

const { validationError } = require("./crud-errors");

/**
 * @typedef {"postgres"|"mongo"} CrudStorageType
 * @typedef {"eq"|"ne"|"in"|"nin"|"gte"|"lte"|"gt"|"lt"|"contains"|"startsWith"} CrudOperator
 *
 * @typedef {Object} CrudResourceConfig
 * @property {string} resource URL-safe resource key. Never comes from the client.
 * @property {string} displayName Human readable name for errors/audit.
 * @property {{type: CrudStorageType, table?: string, collection?: string, modelName?: string, primaryKey?: string, idType?: "integer"|"uuid"|"objectId"|"string"}} storage
 * @property {Object<string, string|string[]|{any?: string[], all?: string[]}>} permissions Permission code per action.
 * @property {{readable: string[], selectable: string[], searchable?: string[], sortable?: string[], filterable?: Object<string, CrudOperator[]>, create?: string[], update?: string[]}} fields
 * @property {{createSchema?: import("zod").ZodTypeAny, updateSchema?: import("zod").ZodTypeAny, bulkCreateSchema?: import("zod").ZodTypeAny, bulkUpdateSchema?: import("zod").ZodTypeAny, rejectUnknownFields?: boolean}} [validation]
 * @property {{enabled: boolean, field?: string}} [softDelete]
 * @property {{enabled: boolean, resourceType?: string, redactFields?: string[]}} [audit]
 * @property {{defaultPageSize?: number, maxPageSize?: number, maxBulkSize?: number, maxSelectSize?: number}} [limits]
 * @property {Object<string, boolean>} [actions]
 * @property {Object<string, Function>} [hooks]
 * @property {boolean} [public]
 */

const DEFAULT_ACTIONS = Object.freeze({
  select: true,
  list: true,
  detail: true,
  create: true,
  bulkCreate: true,
  update: true,
  bulkUpdate: true,
  delete: true,
  bulkDelete: true,
  restore: true,
  bulkRestore: true,
});

const DEFAULT_LIMITS = Object.freeze({
  defaultPageSize: 20,
  maxPageSize: 100,
  maxBulkSize: 500,
  maxSelectSize: 50,
});

const normalizeCrudResourceConfig = (config) => {
  if (!config?.resource || !/^[a-z0-9-]+$/.test(config.resource)) {
    throw validationError("Invalid CRUD resource key", { resource: config?.resource });
  }
  if (!["postgres", "mongo"].includes(config.storage?.type)) {
    throw validationError("Invalid CRUD storage type", { resource: config.resource, storage: config.storage });
  }
  if (config.storage.type === "postgres" && !config.storage.modelName && !config.storage.table) {
    throw validationError("Postgres CRUD resource requires modelName or table", { resource: config.resource });
  }
  if (config.storage.type === "mongo" && !config.storage.collection) {
    throw validationError("Mongo CRUD resource requires collection", { resource: config.resource });
  }

  const fields = config.fields ?? {};
  const readable = new Set(fields.readable ?? []);
  for (const field of [...(fields.selectable ?? []), ...(fields.searchable ?? []), ...(fields.sortable ?? [])]) {
    if (!readable.has(field)) {
      throw validationError("CRUD field whitelist references a non-readable field", { resource: config.resource, field });
    }
  }

  return {
    ...config,
    displayName: config.displayName ?? config.resource,
    actions: { ...DEFAULT_ACTIONS, ...(config.actions ?? {}) },
    fields: {
      searchable: [],
      sortable: [],
      filterable: {},
      create: [],
      update: [],
      ...fields,
    },
    validation: {
      rejectUnknownFields: true,
      ...(config.validation ?? {}),
    },
    limits: { ...DEFAULT_LIMITS, ...(config.limits ?? {}) },
    softDelete: { enabled: false, field: "deletedAt", ...(config.softDelete ?? {}) },
    audit: { enabled: false, resourceType: config.resource, redactFields: [], ...(config.audit ?? {}) },
    hooks: config.hooks ?? {},
  };
};

module.exports = {
  DEFAULT_ACTIONS,
  DEFAULT_LIMITS,
  normalizeCrudResourceConfig,
};
