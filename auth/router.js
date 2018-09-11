"use strict";
const express = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const { JWT_SECRET, JWT_EXPIRY } = require("../config");
const router = express.Router();

// User in this context is email and password
const createAuthToken = function(user) {
  const data = {
    subject: user.email,
    expiresIn: JWT_EXPIRY,
    algorithm: "HS256"
  };
  return jwt.sign({ user }, JWT_SECRET, data);
};

const localAuth = passport.authenticate("local", { session: false });
router.use(bodyParser.json());

// The user provides an email and password to login
router.post("/login", localAuth, (req, res) => {
  const authToken = createAuthToken(req.body);
  res.json({ authToken });
});

const jwtAuth = passport.authenticate("jwt", { session: false });

// The user exchanges a valid JWT for a new one with a later expiration
router.post("/refresh", jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = { router, jwtAuth };
