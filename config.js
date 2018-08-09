"use strict";

exports.DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/write-to-speak-api";
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || "mongodb://localhost:27017/test-write-to-speak-api";

exports.PORT = process.env.PORT || 8080;
