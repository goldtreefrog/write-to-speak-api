"use strict";

const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("./../models/user.js");
const jwtSecret = process.env.JWT_SECRET || "lycreamedicEisnOtdead";

const passportConfig = function(passport) {
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  opts.secretOrKey = jwtSecret;
  passport.use(
    new JwtStrategy(opts, function(jwt_payload, done) {
      User.findOne({ id: jwt_payload.id }, function(err, user) {
        if (err) {
          return done(err, false);
        }
        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      });
    })
  );
};

exports.PASSPORT_CONFIG = passportConfig;
exports.JWT_SECRET = jwtSecret;
exports.JWT_EXPIRY = 300; // "7d";
