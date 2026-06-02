# Backend DB lifecycle

This backend uses a dedicated Postgres test database for migration, seed, and readiness verification.

## Test database

The test database is defined in `docker-compose.test.yml` and `.env.test.example`.

Default test values:

- `DATABASE_HOST=127.0.0.1`
- `DATABASE_PORT=54329`
- `DATABASE_NAME=base_nodejs_test`
- `DATABASE_USER=base_test`
- `DATABASE_PASSWORD=base_test_password`
- `MONGO_ENABLED=false`

These are test-only credentials. Do not reuse them for production.

## Commands

Run the DB lifecycle sequence from `base-nodejs`:

```bash
npm run db:test:up
npm run db:migrate:status
npm run db:migrate
npm run db:migrate
npm run db:seed
npm run db:seed
npm run db:seed:auth
npm run db:seed:auth
node scripts/run-with-env.js .env.test.example node scripts/ready-smoke.js 200
npm run db:test:down
```

`npm run db:*` uses `.env.test.example` by default through `scripts/run-with-env.js`.
To run against another environment file, set `DB_ENV_FILE` or `ENV_FILE`.

Example:

```bash
DB_ENV_FILE=.env.staging npm run db:migrate
```

## Integration tests

DB integration tests are opt-in because they require Docker/Postgres:

```bash
npm run db:test:up
RUN_DB_INTEGRATION=true npm test
npm run db:test:down
```

The DB integration suite verifies:

- migration status runs on an empty DB
- migration is idempotent
- `schema_migrations` records `001_base_auth.sql`
- seed is idempotent
- bootstrap admin is idempotent

## CI checklist

Backend CI should run:

1. `npm ci` or `npm install`
2. `npm run lint`
3. `npm test`
4. `npm audit --audit-level=high`
5. `npm run db:test:up`
6. `npm run db:migrate:status`
7. `npm run db:migrate`
8. `npm run db:migrate`
9. `npm run db:seed`
10. `npm run db:seed`
11. `npm run db:seed:auth`
12. `npm run db:seed:auth`
13. `node scripts/run-with-env.js .env.test.example node scripts/ready-smoke.js 200`
14. `RUN_DB_INTEGRATION=true npm test`
15. `npm run db:test:down`

`/health` only checks process liveness. `/ready` checks Postgres and enabled optional dependencies.

