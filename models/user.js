"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
// const jwt = require("jasonwebtoken");

// Schema for a user
const registeredUserSchema = mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, trim: true, unique: 1, minlength: 5 },
    password: { type: String, required: true, trim: true, minlength: 6, maxlength: 72 }
  },
  {
    timestamps: true
  }
);

//thinkful
registeredUserSchema.methods.serialize = function() {
  return {
    email: this.email || "",
    firstName: this.firstName || "",
    lastName: this.lastName || ""
  };
};
registeredUserSchema.methods.validatePassword = function(password) {
  console.log("validating password");
  return bcrypt.compare(password, this.password);
};

registeredUserSchema.statics.hashPassword = function(password) {
  console.log("hashing password");
  return bcrypt.hash(password, 12);
};

// complete react fullstack course
// registeredUserSchema.methods.generateToken = function(callback) {
//   const user = this;
//   const token = jwt.sign(registeredUser._id.toHexString());
// };

const RegisteredUser = mongoose.model("RegisteredUser", registeredUserSchema);

module.exports = { RegisteredUser };
