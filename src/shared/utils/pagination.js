"use strict";

const toPagination = ({ page, limit, totalItems }) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.ceil(totalItems / limit),
});

module.exports = { toPagination };
