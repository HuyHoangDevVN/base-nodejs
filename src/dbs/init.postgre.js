"use strict";

const db = require("../models/postgreSQL");

const connectPostgreSQL = async () => {
  await db.sequelize.authenticate();
  return db.sequelize;
};

module.exports = {
  sequelize: db.sequelize,
  connectPostgreSQL,
};
