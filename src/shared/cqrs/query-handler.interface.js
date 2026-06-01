"use strict";

/**
 * Query handlers read state only. Implementations expose execute(query).
 */
class QueryHandler {
  execute() {
    throw new Error("QueryHandler.execute must be implemented");
  }
}

module.exports = { QueryHandler };
