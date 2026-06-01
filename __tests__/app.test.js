"use strict";

const request = require("supertest");
const app = require("../src/app");

describe("app foundation", () => {
  test("GET /health returns standard success envelope", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      code: "OK",
      message: "Service is healthy",
    });
    expect(response.body.data).toHaveProperty("uptime");
  });

  test("unknown route returns standard error envelope", async () => {
    const response = await request(app).get("/missing").expect(404);

    expect(response.body).toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });
  });

  test("invalid cohort query returns validation error before service execution", async () => {
    const response = await request(app).get("/v1/api/cohorts?limit=500").expect(422);

    expect(response.body).toMatchObject({
      success: false,
      code: "VALIDATION_ERROR",
    });
    expect(Array.isArray(response.body.details)).toBe(true);
  });

  test("mutating cohort endpoint requires authentication", async () => {
    const response = await request(app)
      .post("/v1/api/cohorts")
      .send({ code: "K50", name: "Cohort 50", start_year: 2026 })
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      code: "UNAUTHORIZED",
    });
  });

  test("auth login returns user and token contract", async () => {
    const response = await request(app)
      .post("/v1/api/auth/login")
      .send({ email: "admin@example.com", password: "password" })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      code: "OK",
      data: {
        user: {
          email: "admin@example.com",
          role: "admin",
        },
      },
    });
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
  });
});
