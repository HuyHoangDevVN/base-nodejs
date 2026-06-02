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
    select: "academic.cohort.read",
    list: "academic.cohort.read",
    detail: "academic.cohort.read",
    create: "academic.cohort.create",
    bulkCreate: "academic.cohort.create",
    update: "academic.cohort.update",
    bulkUpdate: "academic.cohort.update",
    delete: "academic.cohort.delete",
    bulkDelete: "academic.cohort.delete",
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
