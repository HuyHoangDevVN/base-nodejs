"use strict";

/**
 * Command handlers mutate state. Implementations expose execute(command).
 */
class CommandHandler {
  execute() {
    throw new Error("CommandHandler.execute must be implemented");
  }
}

module.exports = { CommandHandler };
