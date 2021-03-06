"use strict";

exports.DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://localhost:27017/write-to-speak-api";
exports.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "mongodb://localhost:27017/test-write-to-speak-api"; // specifying the port in the URL seems to be related to a specific version of Mongoose; if you update, you probably will not have to do this.

exports.PORT = process.env.PORT || 8080;
exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
