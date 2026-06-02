"use strict";

require("dotenv").config();
const { z } = require("zod");

const isProduction = process.env.NODE_ENV === "production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3055),
  DATABASE_HOST: z.string().default("localhost"),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_NAME: z.string().default("db_ecommerce_dev"),
  DATABASE_USER: z.string().default("postgres"),
  DATABASE_PASSWORD: z.string().default("postgres"),
  DATABASE_DIALECT: z.enum(["postgres"]).default("postgres"),
  JWT_ACCESS_SECRET: z.string().min(isProduction ? 32 : 8).default("dev-access-secret"),
  JWT_REFRESH_SECRET: z.string().min(isProduction ? 32 : 8).default("dev-refresh-secret"),
  JWT_ISSUER: z.string().default("obe-auth-service"),
  JWT_AUDIENCE: z.string().default("obe-api"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  AUTH_ENV_ADMIN_ENABLED: z.enum(["true", "false"]).default("false"),
  BOOTSTRAP_ADMIN_ENABLED: z.enum(["true", "false"]).default("false"),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).optional(),
  MONGO_ENABLED: z.enum(["true", "false"]).default("false"),
  MONGO_URI: z.string().url().optional(),
  MONGO_DB_NAME: z.string().min(1).optional(),
  APP_NAME: z.string().default("obe-base-api"),
  APP_VERSION: z.string().default("1.0.0"),
  COMMIT_SHA: z.string().optional(),
  BUILD_TIME: z.string().optional(),
  LOG_LEVEL: z.string().default(isProduction ? "info" : "debug"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173"),
  API_REQUIRE_AUTH_FOR_READS: z.enum(["true", "false"]).default("false"),
  AUTH_ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  AUTH_ADMIN_PASSWORD: z.string().min(6).default("password"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

if (env.NODE_ENV === "production") {
  const weakDb =
    env.DATABASE_HOST === "localhost" ||
    env.DATABASE_USER === "postgres" ||
    env.DATABASE_PASSWORD === "postgres";
  const weakJwt =
    env.JWT_ACCESS_SECRET === "dev-access-secret" ||
    env.JWT_REFRESH_SECRET === "dev-refresh-secret";

  if (weakDb || weakJwt) {
    console.error("Refusing to start production with weak default DB/JWT configuration");
    process.exit(1);
  }
}

env.CORS_ORIGINS_LIST = env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
env.API_REQUIRE_AUTH_FOR_READS_BOOL = env.API_REQUIRE_AUTH_FOR_READS === "true";
env.AUTH_ENV_ADMIN_ENABLED_BOOL = env.AUTH_ENV_ADMIN_ENABLED === "true";
env.BOOTSTRAP_ADMIN_ENABLED_BOOL = env.BOOTSTRAP_ADMIN_ENABLED === "true";
env.MONGO_ENABLED_BOOL = env.MONGO_ENABLED === "true";

module.exports = { env };
