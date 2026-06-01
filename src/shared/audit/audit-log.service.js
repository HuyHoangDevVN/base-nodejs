"use strict";

class AuditLogService {
  constructor({ repository } = {}) {
    this.repository = repository;
  }

  async record(event) {
    if (!this.repository?.create) return null;
    return this.repository.create({
      actorUserId: event.actorUserId ?? null,
      targetUserId: event.targetUserId ?? null,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId ?? null,
      beforeJson: event.before ?? null,
      afterJson: event.after ?? null,
      ipAddress: event.ipAddress ?? null,
      userAgent: event.userAgent ?? null,
      requestId: event.requestId ?? null,
    });
  }
}

module.exports = { AuditLogService };
