"use strict";

const { createCrudRoutes } = require("../../shared/crud/core/crud-route.factory");
const { systemLogResourceConfig } = require("./system-log.config");

module.exports = createCrudRoutes(systemLogResourceConfig);
