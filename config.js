"use strict";

exports.DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost/write-to-speak-api";
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || "mongodb://localhost/test-write-to-speak-api";

exports.PORT = process.env.PORT || 8080;
// exports.BIG_SECRET = process.env.JWT_SECRET;
// exports.JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";
