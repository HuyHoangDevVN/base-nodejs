"use strict";

const { createCrudRoutes } = require("../../shared/crud/core/crud-route.factory");
const { academicCohortResourceConfig } = require("./academic-cohort.config");

module.exports = createCrudRoutes(academicCohortResourceConfig);
