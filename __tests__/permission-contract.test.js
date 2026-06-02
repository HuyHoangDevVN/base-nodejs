"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DEFAULT_PERMISSIONS } = require("../src/dbs/seeds/base-auth.seed");
const { academicCohortResourceConfig } = require("../src/modules/academic-cohorts/academic-cohort.config");
const { systemLogResourceConfig } = require("../src/modules/system-logs/system-log.config");

const seededCodes = new Set(DEFAULT_PERMISSIONS.map(([code]) => code));

const collectPermissionCodes = (value, output = new Set()) => {
  if (!value) return output;
  if (typeof value === "string") output.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectPermissionCodes(item, output));
  else if (typeof value === "object") Object.values(value).forEach((item) => collectPermissionCodes(item, output));
  return output;
};

describe("permission code contract", () => {
  test("backend resource configs only use seeded permission codes", () => {
    const required = new Set([
      ...collectPermissionCodes(academicCohortResourceConfig.permissions),
      ...collectPermissionCodes(systemLogResourceConfig.permissions),
    ]);
    const missing = [...required].filter((code) => !seededCodes.has(code));
    expect(missing).toEqual([]);
  });

  test("frontend academic/sidebar permission codes exist in backend seed", () => {
    const frontendRoot = path.join(__dirname, "..", "..", "base-reactjs", "src");
    const files = [
      "features/academic-cohorts/academicCohortsCrudConfig.ts",
      "components/sidebars/admin/adminMenu.config.tsx",
      "features/cohorts/pages/CohortListPage.tsx",
      "features/cohorts/pages/CohortFormPage.tsx",
      "features/cohorts/pages/CohortDetailPage.tsx",
    ];
    const contents = files.map((file) => fs.readFileSync(path.join(frontendRoot, file), "utf8")).join("\n");
    const codes = [...contents.matchAll(/['"]([a-z]+(?:\.[a-z0-9_]+){2,})['"]/g)].map((match) => match[1]);
    const missing = [...new Set(codes)].filter((code) => !seededCodes.has(code));
    expect(missing).toEqual([]);
  });
});
