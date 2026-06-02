"use strict";

const SENSITIVE_FIELD_PATTERN = /password|token|secret|credential|refresh/i;

const redactValue = "[REDACTED]";

const redactObject = (value, redactFields = []) => {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redactObject(item, redactFields));
  const redactSet = new Set(redactFields);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (redactSet.has(key) || SENSITIVE_FIELD_PATTERN.test(key)) return [key, redactValue];
    return [key, redactObject(item, redactFields)];
  }));
};

class CrudAudit {
  constructor({ auditLogService } = {}) {
    this.auditLogService = auditLogService;
  }

  async record(config, ctx, event) {
    if (!config.audit?.enabled || !this.auditLogService?.record) return null;
    const redactFields = config.audit.redactFields ?? [];
    return this.auditLogService.record({
      actorUserId: ctx.actorUserId ?? ctx.authUserId ?? null,
      action: event.action,
      resourceType: config.audit.resourceType ?? config.resource,
      resourceId: event.resourceId ?? null,
      resourceIds: event.resourceIds ?? undefined,
      before: redactObject(event.before, redactFields),
      after: redactObject(event.after, redactFields),
      requestId: ctx.requestId,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }
}

module.exports = {
  CrudAudit,
  redactObject,
};
