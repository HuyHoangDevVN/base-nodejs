"use strict";

const { z } = require("zod");

const idParams = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).default(""),
  sort: z.enum(["created_at", "name", "code"]).default("created_at"),
  order: z.enum(["ASC", "DESC"]).default("DESC"),
});

const cohortCreateBody = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(255),
  start_year: z.coerce.number().int().min(1900).max(2200),
  end_year: z.coerce.number().int().min(1900).max(2200).nullable().optional(),
  created_by: z.coerce.number().int().positive().nullable().optional(),
});

const cohortUpdateBody = cohortCreateBody.partial().extend({
  modified_by: z.coerce.number().int().positive().nullable().optional(),
}).refine((body) => Object.keys(body).length > 0, {
  message: "At least one field is required",
});

const deleteManyBody = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(100),
});

module.exports = {
  idParams,
  listQuery,
  cohortCreateBody,
  cohortUpdateBody,
  deleteManyBody,
};
