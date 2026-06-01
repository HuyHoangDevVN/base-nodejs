"use strict";

const { env } = require("./env");

module.exports = {
  app: {
    port: env.PORT,
  },
  db: {
    dialect: env.DATABASE_DIALECT,
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    name: env.DATABASE_NAME,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
  },
};
