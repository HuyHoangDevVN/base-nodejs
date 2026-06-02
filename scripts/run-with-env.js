"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const dotenv = require("dotenv");

const [, , defaultEnvFile, command, ...commandArgs] = process.argv;

if (!defaultEnvFile || !command) {
  process.stderr.write("Usage: node scripts/run-with-env.js <env-file> <command> [...args]\n");
  process.exit(2);
}

const requestedEnvFile = process.env.DB_ENV_FILE || process.env.ENV_FILE || defaultEnvFile;
const envFile = path.isAbsolute(requestedEnvFile) ? requestedEnvFile : path.join(process.cwd(), requestedEnvFile);

if (!fs.existsSync(envFile)) {
  process.stderr.write(`Environment file not found: ${envFile}\n`);
  process.exit(2);
}

const parsed = dotenv.parse(fs.readFileSync(envFile));
const childEnv = {
  ...process.env,
  ...parsed,
  ENV_FILE: envFile,
};

process.stdout.write(`Using env file: ${envFile}\n`);

const child = spawn(command, commandArgs, {
  cwd: process.cwd(),
  env: childEnv,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.stderr.write(`Command terminated by signal ${signal}\n`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});
