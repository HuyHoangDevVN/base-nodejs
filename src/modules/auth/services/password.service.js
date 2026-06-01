"use strict";

const bcrypt = require("bcrypt");
const { assertPasswordPolicy } = require("../../../shared/security/password-policy");

class PasswordService {
  constructor({ rounds = 12 } = {}) {
    this.rounds = rounds;
  }

  async hash(password) {
    assertPasswordPolicy(password);
    return bcrypt.hash(password, this.rounds);
  }

  hashExisting(password) {
    return bcrypt.hash(password, this.rounds);
  }

  verify(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
  }
}

module.exports = { PasswordService };
