"use strict";

const { ALL_CRUD_OPERATORS, CrudOperators } = require("../types/crud-operators");
const { validationError } = require("./crud-errors");

const RESERVED_QUERY_KEYS = new Set(["page", "limit", "search", "sort", "order", "filters"]);
const DANGEROUS_KEY = /(^\$)|(\.)/;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const escapeLike = (value) => String(value).replace(/[\\%_]/g, (char) => `\\${char}`).trim();
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseFilterValue = (value, operator) => {
  if ([CrudOperators.IN, CrudOperators.NIN].includes(operator)) {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    return String(value).split(",").map((item) => item.trim()).filter(Boolean);
  }
  return Array.isArray(value) ? value[0] : value;
};

const parseFiltersObject = (rawFilters) => {
  if (!rawFilters) return {};
  if (typeof rawFilters === "object") return rawFilters;
  try {
    const parsed = JSON.parse(rawFilters);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    throw validationError("Invalid filters JSON", [{ path: ["filters"], message: "filters must be a JSON object" }]);
  }
};

const normalizeFilter = (field, rawValue, allowedOperators) => {
  if (DANGEROUS_KEY.test(field)) {
    throw validationError("Invalid filter field", [{ path: [field], message: "Operator injection is not allowed" }]);
  }

  if (typeof rawValue === "object" && rawValue !== null && !Array.isArray(rawValue)) {
    const entries = Object.entries(rawValue);
    return entries.map(([operator, value]) => {
      if (DANGEROUS_KEY.test(operator) || !ALL_CRUD_OPERATORS.has(operator) || !allowedOperators.includes(operator)) {
        throw validationError("Filter operator is not allowed", [{ path: [field, operator], message: "Operator is not whitelisted" }]);
      }
      return { field, operator, value: parseFilterValue(value, operator) };
    });
  }

  const operator = allowedOperators.includes(CrudOperators.EQ) ? CrudOperators.EQ : allowedOperators[0];
  if (!operator) {
    throw validationError("Filter operator is not allowed", [{ path: [field], message: "No operator configured" }]);
  }
  return [{ field, operator, value: parseFilterValue(rawValue, operator) }];
};

const parseCrudQuery = (config, query = {}, { mode = "list" } = {}) => {
  const page = Math.max(toPositiveInt(query.page, 1), 1);
  const maxLimit = mode === "select" ? config.limits.maxSelectSize : config.limits.maxPageSize;
  const defaultLimit = mode === "select" ? Math.min(config.limits.maxSelectSize, config.limits.defaultPageSize) : config.limits.defaultPageSize;
  const limit = Math.min(toPositiveInt(query.limit, defaultLimit), maxLimit);
  const offset = (page - 1) * limit;
  const search = typeof query.search === "string" && query.search.trim() ? query.search.trim() : "";
  const sortField = query.sort || (config.fields.sortable?.[0] ?? config.storage.primaryKey ?? "id");
  const order = String(query.order ?? "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

  if (sortField && !config.fields.sortable.includes(sortField)) {
    throw validationError("Sort field is not allowed", [{ path: ["sort"], message: `${sortField} is not sortable` }]);
  }

  const filterSource = { ...parseFiltersObject(query.filters) };
  for (const [key, value] of Object.entries(query)) {
    if (!RESERVED_QUERY_KEYS.has(key)) filterSource[key] = value;
  }

  const filters = [];
  for (const [field, value] of Object.entries(filterSource)) {
    const allowedOperators = config.fields.filterable[field];
    if (!allowedOperators) {
      throw validationError("Filter field is not allowed", [{ path: [field], message: `${field} is not filterable` }]);
    }
    filters.push(...normalizeFilter(field, value, allowedOperators));
  }

  return {
    page,
    limit,
    offset,
    search,
    searchLike: search ? escapeLike(search) : "",
    searchRegex: search ? escapeRegex(search) : "",
    filters,
    sort: sortField ? { field: sortField, order } : undefined,
  };
};

module.exports = {
  escapeLike,
  escapeRegex,
  parseCrudQuery,
};
