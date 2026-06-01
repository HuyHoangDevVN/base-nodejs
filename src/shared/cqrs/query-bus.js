"use strict";

class QueryBus {
  constructor(handlers = new Map()) {
    this.handlers = handlers;
  }

  register(queryType, handler) {
    this.handlers.set(queryType, handler);
    return this;
  }

  async execute(query) {
    const queryType = query?.type;
    const handler = this.handlers.get(queryType);
    if (!handler) {
      throw new Error(`No query handler registered for ${queryType}`);
    }
    return handler.execute(query);
  }
}

module.exports = { QueryBus };
