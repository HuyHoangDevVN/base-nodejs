const swaggerJsdoc = require("swagger-jsdoc");
const { env } = require("./env");

// Import schemas and components
const commonSchemas = require("./swagger/schemas/common.schemas");
const cohortSchemas = require("./swagger/schemas/cohort.schemas");
const cohortResponses = require("./swagger/schemas/cohort.responses");
const commonParameters = require("./swagger/parameters");
const commonResponses = require("./swagger/responses");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Base NodeJS API",
      version: "1.0.0",
      description: "API documentation for Base NodeJS project",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: process.env.API_PUBLIC_URL || `http://localhost:${env.PORT}/v1/api`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // Common schemas
        ...commonSchemas,
        // Cohort schemas
        ...cohortSchemas,
        // Cohort response schemas
        ...cohortResponses,
      },
      parameters: {
        ...commonParameters,
      },
      responses: {
        ...commonResponses,
      },
    },
    paths: {
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with environment-backed admin credentials",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful" },
            401: { description: "Invalid credentials" },
            422: { description: "Validation error" },
          },
        },
      },
      "/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Rotate refresh token and issue a new access token",
          responses: {
            200: { description: "Token refreshed" },
            401: { description: "Invalid refresh token" },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Revoke refresh token",
          responses: {
            200: { description: "Logout successful" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Current user" },
            401: { description: "Authentication required" },
          },
        },
      },
      "/cohorts": {
        get: {
          tags: ["Cohorts"],
          summary: "List cohorts",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
            { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
          ],
          responses: {
            200: { description: "Cohorts retrieved" },
            422: { description: "Validation error" },
          },
        },
        post: {
          tags: ["Cohorts"],
          summary: "Create cohort",
          security: [{ bearerAuth: [] }],
          responses: {
            201: { description: "Cohort created" },
            401: { description: "Authentication required" },
            403: { description: "Insufficient permissions" },
            409: { description: "Cohort code already exists" },
            422: { description: "Validation error" },
          },
        },
      },
      "/cohorts/{id}": {
        get: {
          tags: ["Cohorts"],
          summary: "Get cohort by id",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
          responses: {
            200: { description: "Cohort retrieved" },
            404: { description: "Cohort not found" },
          },
        },
        patch: {
          tags: ["Cohorts"],
          summary: "Update cohort",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
          responses: {
            200: { description: "Cohort updated" },
            401: { description: "Authentication required" },
            403: { description: "Insufficient permissions" },
            404: { description: "Cohort not found" },
          },
        },
        delete: {
          tags: ["Cohorts"],
          summary: "Delete cohort",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
          responses: {
            200: { description: "Cohort deleted" },
            401: { description: "Authentication required" },
            403: { description: "Insufficient permissions" },
            404: { description: "Cohort not found" },
          },
        },
      },
      "/cohorts/bulk": {
        delete: {
          tags: ["Cohorts"],
          summary: "Delete multiple cohorts",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Cohorts deleted" },
            401: { description: "Authentication required" },
            403: { description: "Insufficient permissions" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = { swaggerSpec, swaggerOptions };
