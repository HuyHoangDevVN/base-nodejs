"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const dotenv = require("dotenv");
const { Client } = require("pg");

const shouldRun = process.env.RUN_DB_INTEGRATION === "true";
const describeDb = shouldRun ? describe : describe.skip;
const envFile = path.join(__dirname, "..", ".env.test.example");
const envValues = dotenv.parse(fs.readFileSync(envFile));

const runNodeScript = (args) => {
  const result = spawnSync(process.execPath, args, {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      RUN_DB_INTEGRATION: "true",
    },
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: node ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  }

  return result.stdout;
};

const withClient = async (fn) => {
  const client = new Client({
    host: envValues.DATABASE_HOST,
    port: Number(envValues.DATABASE_PORT),
    database: envValues.DATABASE_NAME,
    user: envValues.DATABASE_USER,
    password: envValues.DATABASE_PASSWORD,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
};

const countTable = (client, tableName) =>
  client.query(`SELECT COUNT(*)::int AS count FROM ${tableName}`).then((result) => result.rows[0].count);

describeDb("database lifecycle integration", () => {
  jest.setTimeout(60_000);

  test("migration status and migrate are idempotent on test postgres", async () => {
    runNodeScript(["scripts/run-with-env.js", ".env.test.example", "node", "scripts/db-migrate-status.js"]);
    runNodeScript(["scripts/run-with-env.js", ".env.test.example", "node", "scripts/db-migrate.js"]);
    const status = runNodeScript(["scripts/run-with-env.js", ".env.test.example", "node", "scripts/db-migrate-status.js"]);
    runNodeScript(["scripts/run-with-env.js", ".env.test.example", "node", "scripts/db-migrate.js"]);

    expect(status).toContain("001_base_auth.sql applied");
    await withClient(async (client) => {
      const result = await client.query("SELECT name FROM schema_migrations WHERE name = $1", ["001_base_auth.sql"]);
      expect(result.rowCount).toBe(1);
    });
  });

  test("seed and bootstrap admin are idempotent", async () => {
    runNodeScript(["scripts/run-with-env.js", ".env.test.example", "node", "scripts/db-migrate.js"]);
    runNodeScript(["scripts/run-with-env.js", ".env.test.example", "node", "scripts/db-seed-auth.js", "--no-bootstrap"]);

    const before = await withClient(async (client) => ({
      roles: await countTable(client, "roles"),
      permissions: await countTable(client, "permissions"),
      groups: await countTable(client, "permission_groups"),
    }));

    runNodeScript(["scripts/run-with-env.js", ".env.test.example", "node", "scripts/db-seed-auth.js", "--no-bootstrap"]);
    runNodeScript(["scripts/run-with-env.js", ".env.test.example", "node", "scripts/db-seed-auth.js"]);
    runNodeScript(["scripts/run-with-env.js", ".env.test.example", "node", "scripts/db-seed-auth.js"]);

    const after = await withClient(async (client) => ({
      roles: await countTable(client, "roles"),
      permissions: await countTable(client, "permissions"),
      groups: await countTable(client, "permission_groups"),
      adminUsers: (
        await client.query("SELECT COUNT(*)::int AS count FROM auth_users WHERE email = $1", [
          envValues.BOOTSTRAP_ADMIN_EMAIL,
        ])
      ).rows[0].count,
    }));

    expect(after.roles).toBe(before.roles);
    expect(after.permissions).toBe(before.permissions);
    expect(after.groups).toBe(before.groups);
    expect(after.adminUsers).toBe(1);
  });
});

