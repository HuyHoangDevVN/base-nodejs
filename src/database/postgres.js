"use strict";

const db = require("../models/postgreSQL");

const withPostgresTransaction = (fn, { sequelize = db.sequelize } = {}) => sequelize.transaction(fn);

module.exports = {
  db,
  sequelize: db.sequelize,
  withPostgresTransaction,
};
