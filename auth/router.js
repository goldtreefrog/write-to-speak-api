"use strict";
const express = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { RegisteredUser } = require("./../models/user.js");
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

router.post("/logout", jwtAuth, (req, res) => {
  RegisteredUser.findOne({ email: req.body.email }).then(user => {
    user.lastLogout = new Date();
    user.save().then(user => {
      return res.status(200).json(user.serialize());
    });
  });
});

router.post("/refresh", jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = { router, jwtAuth };
