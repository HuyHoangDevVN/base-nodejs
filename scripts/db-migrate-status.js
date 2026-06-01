"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const db = require("../src/models/postgreSQL");

const migrationsDir = path.join(__dirname, "..", "src", "dbs", "migrations");

const formatError = (error) =>
  error?.message || error?.parent?.message || error?.original?.message || error?.stack || String(error);

const run = async () => {
  await db.sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      checksum VARCHAR(128),
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const [rows] = await db.sequelize.query("SELECT name, applied_at FROM schema_migrations ORDER BY name ASC");
  const applied = new Map(rows.map((row) => [row.name, row.applied_at]));
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const status = applied.has(file) ? `applied ${new Date(applied.get(file)).toISOString()}` : "pending";
    process.stdout.write(`${file} ${status}\n`);
  }
};

run()
  .then(() => db.sequelize.close())
  .catch(async (error) => {
    console.error(formatError(error));
    await db.sequelize.close().catch(() => {});
    process.exit(1);
  });
