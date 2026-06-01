"use strict";

class CommandBus {
  constructor(handlers = new Map()) {
    this.handlers = handlers;
  }

  register(commandType, handler) {
    this.handlers.set(commandType, handler);
    return this;
  }

  async execute(command) {
    const commandType = command?.type;
    const handler = this.handlers.get(commandType);
    if (!handler) {
      throw new Error(`No command handler registered for ${commandType}`);
    }
    return handler.execute(command);
  }
}

module.exports = { CommandBus };
