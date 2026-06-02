"use strict";

const { spawnSync } = require("node:child_process");

const action = process.argv[2];
const composeArgs = ["compose", "--env-file", ".env.test.example", "-f", "docker-compose.test.yml"];

const runDocker = (args) => {
  const result = spawnSync("docker", args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

if (action === "up") {
  runDocker([...composeArgs, "up", "-d"]);
} else if (action === "down") {
  runDocker([...composeArgs, "down", "-v"]);
} else if (action === "reset") {
  runDocker([...composeArgs, "down", "-v"]);
  runDocker([...composeArgs, "up", "-d"]);
} else {
  process.stderr.write("Usage: node scripts/db-test-env.js <up|down|reset>\n");
  process.exit(2);
}
