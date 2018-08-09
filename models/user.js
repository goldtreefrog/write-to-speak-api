"use strict";

const mongoose = require("mongoose");
const { SnippetSchema } = require("./snippet.js");
const bcrypt = require("bcrypt");

// Schema for a user
const registeredUserSchema = mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, trim: true, unique: 1, minlength: 5 },
    password: { type: String, required: true, trim: true, minlength: 6, maxlength: 72 },
    snippets: [SnippetSchema]
  },
  {
    timestamps: true
  }
);

// For just name & email
registeredUserSchema.methods.serialize = function() {
  return {
    _id: this._id || "",
    email: this.email || "",
    firstName: this.firstName || "",
    lastName: this.lastName || "",
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

registeredUserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

registeredUserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 12);
};

const RegisteredUser = mongoose.model("RegisteredUser", registeredUserSchema);

module.exports = { RegisteredUser };
