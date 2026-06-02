"use strict";

const { mapCohort } = require("./academic-cohort.mapper");
const { applyAcademicCohortOwnershipScope } = require("./academic-cohort.policy");
const { academicCohortCreateSchema, academicCohortUpdateSchema } = require("./academic-cohort.validators");

const academicCohortResourceConfig = {
  resource: "academic-cohorts",
  displayName: "Academic cohort",
  storage: {
    type: "postgres",
    table: "cohorts",
    modelName: "Cohort",
    primaryKey: "id",
    idType: "integer",
  },
  permissions: {
    select: { any: ["cohort.read", "academic.cohort.read", "cohort.manage"] },
    list: { any: ["cohort.read", "academic.cohort.read", "cohort.manage"] },
    detail: { any: ["cohort.read", "academic.cohort.read", "cohort.manage"] },
    create: { any: ["cohort.manage", "academic.cohort.manage"] },
    bulkCreate: { any: ["cohort.manage", "academic.cohort.manage"] },
    update: { any: ["cohort.manage", "academic.cohort.manage"] },
    bulkUpdate: { any: ["cohort.manage", "academic.cohort.manage"] },
    delete: { any: ["cohort.manage", "academic.cohort.manage"] },
    bulkDelete: { any: ["cohort.manage", "academic.cohort.manage"] },
  },
  actions: {
    restore: false,
    bulkRestore: false,
  },
  fields: {
    readable: ["id", "code", "name", "start_year", "end_year", "created_at", "created_by", "modified_at", "modified_by"],
    selectable: ["id", "code", "name"],
    searchable: ["code", "name"],
    sortable: ["created_at", "modified_at", "name", "code", "start_year"],
    filterable: {
      code: ["eq", "contains", "startsWith", "in"],
      name: ["contains", "startsWith"],
      start_year: ["eq", "gte", "lte", "in"],
      end_year: ["eq", "gte", "lte"],
    },
    create: ["code", "name", "start_year", "end_year"],
    update: ["name", "start_year", "end_year"],
  },
  validation: {
    createSchema: academicCohortCreateSchema,
    updateSchema: academicCohortUpdateSchema,
    rejectUnknownFields: true,
  },
  softDelete: {
    enabled: false,
  },
  audit: {
    enabled: true,
    resourceType: "academic_cohort",
    redactFields: [],
  },
  limits: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxBulkSize: 200,
    maxSelectSize: 50,
  },
  hooks: {
    mapListItem: mapCohort,
    mapDetail: mapCohort,
    applyOwnershipScope: applyAcademicCohortOwnershipScope,
    beforeCreate: async (ctx, data) => ({
      ...data,
      created_by: ctx.actorUserId ?? null,
      modified_by: ctx.actorUserId ?? null,
      modified_at: new Date(),
    }),
    beforeUpdate: async (ctx, _id, patch) => ({
      ...patch,
      modified_by: ctx.actorUserId ?? null,
      modified_at: new Date(),
    }),
  },
};

module.exports = { academicCohortResourceConfig };
