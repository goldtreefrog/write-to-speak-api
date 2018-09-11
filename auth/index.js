"use strict";
const { router, jwtAuth } = require("./router");
const { localStrategy, jwtStrategy } = require("./strategies");

module.exports = { router, localStrategy, jwtStrategy, jwtAuth };
