"use strict";

const CrudOperators = Object.freeze({
  EQ: "eq",
  NE: "ne",
  IN: "in",
  NIN: "nin",
  GTE: "gte",
  LTE: "lte",
  GT: "gt",
  LT: "lt",
  CONTAINS: "contains",
  STARTS_WITH: "startsWith",
});

const ALL_CRUD_OPERATORS = new Set(Object.values(CrudOperators));

module.exports = { CrudOperators, ALL_CRUD_OPERATORS };
