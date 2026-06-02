"use strict";

const { z } = require("zod");

const currentYear = new Date().getFullYear();

const academicCohortCreateSchema = z.object({
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(255),
  start_year: z.coerce.number().int().min(1900).max(currentYear + 20),
  end_year: z.coerce.number().int().min(1900).max(currentYear + 30).nullable().optional(),
});

const academicCohortUpdateSchema = academicCohortCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

module.exports = {
  academicCohortCreateSchema,
  academicCohortUpdateSchema,
};
