"use strict";

const { DATABASE_URL, TEST_DATABASE_URL, PORT } = require("./main");
const { PASSPORT_CONFIG, JWT_SECRET, JWT_EXPIRY } = require("./passport");

module.exports = {
  DATABASE_URL,
  TEST_DATABASE_URL,
  PORT,
  PASSPORT_CONFIG,
  JWT_SECRET,
  JWT_EXPIRY
};
