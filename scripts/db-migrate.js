"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const db = require("../src/models/postgreSQL");
const { logger } = require("../src/shared/logger/logger");

const migrationsDir = path.join(__dirname, "..", "src", "dbs", "migrations");

const serializeError = (error) => ({
  name: error?.name,
  message: error?.message,
  stack: error?.stack,
  parentMessage: error?.parent?.message,
  originalMessage: error?.original?.message,
});

const ensureMigrationTable = async () => {
  await db.sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      checksum VARCHAR(128),
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const getApplied = async () => {
  const [rows] = await db.sequelize.query("SELECT name FROM schema_migrations ORDER BY name ASC");
  return new Set(rows.map((row) => row.name));
};

const checksum = (content) => require("node:crypto").createHash("sha256").update(content).digest("hex");

const run = async () => {
  await ensureMigrationTable();
  const applied = await getApplied();
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
  let appliedCount = 0;

  for (const file of files) {
    if (applied.has(file)) {
      logger.info({ migration: file }, "migration_skipped");
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = await fs.readFile(filePath, "utf8");
    const hash = checksum(sql);
    const transaction = await db.sequelize.transaction();
    try {
      logger.info({ migration: file }, "migration_applying");
      await db.sequelize.query(sql, { transaction });
      await db.sequelize.query(
        "INSERT INTO schema_migrations (name, checksum) VALUES (:name, :checksum)",
        { replacements: { name: file, checksum: hash }, transaction }
      );
      await transaction.commit();
      appliedCount += 1;
      logger.info({ migration: file }, "migration_applied");
    } catch (error) {
      await transaction.rollback();
      logger.error({ migration: file, error: serializeError(error) }, "migration_failed");
      throw error;
    }
  }

  logger.info({ appliedCount }, "migrations_complete");
};

run()
  .then(() => db.sequelize.close())
  .catch(async (error) => {
    logger.error({ error: serializeError(error) }, "migrations_failed");
    await db.sequelize.close().catch(() => {});
    process.exit(1);
  });
