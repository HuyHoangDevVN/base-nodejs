"use strict";

const request = require("supertest");
const app = require("../src/app");
const db = require("../src/models/postgreSQL");

const expectedStatus = Number(process.argv[2] ?? 200);

request(app)
  .get("/ready")
  .then(async (response) => {
    process.stdout.write(`${response.status} ${JSON.stringify(response.body)}\n`);
    await db.sequelize.close().catch(() => {});
    if (response.status !== expectedStatus) {
      process.exit(1);
    }
  })
  .catch(async (error) => {
    process.stderr.write(`${error.message}\n`);
    await db.sequelize.close().catch(() => {});
    process.exit(1);
  });

