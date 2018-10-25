"use strict";

const {
  DATABASE_URL,
  TEST_DATABASE_URL,
  PORT,
  CLIENT_ORIGIN
} = require("./main");
const {PASSPORT_CONFIG, JWT_SECRET, JWT_EXPIRY} = require("./passport");

module.exports = {
  DATABASE_URL,
  TEST_DATABASE_URL,
  PORT,
  CLIENT_ORIGIN,
  PASSPORT_CONFIG,
  JWT_SECRET,
  JWT_EXPIRY
};
