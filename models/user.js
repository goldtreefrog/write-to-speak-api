"use strict";

const mongoose = require("mongoose");
const { SnippetSchema } = require("./snippetSchema.js");
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

// When creating virtual, must use get(function) rather than ES6 get(()=>) in order to have 'this' refer to the model rather than this whole file.
registeredUserSchema.virtual("snippetCount").get(function() {
  let length = 0;
  if (this.snippets.length) {
    length = this.snippets.length;
  }
  return length;
});

registeredUserSchema.virtual("maxOrder").get(function() {
  let orderedSnippets = this.snippets.sort(function(a, b) {
    return b.snippetOrder - a.snippetOrder;
  });
  return orderedSnippets[0].snippetOrder;
});

// For just name & email
registeredUserSchema.methods.serialize = function() {
  let sortedSnippets = this.snippets.sort(function(a, b) {
    return a.snippetOrder - b.snippetOrder;
  });
  return {
    _id: this._id || "",
    email: this.email || "",
    firstName: this.firstName || "",
    lastName: this.lastName || "",
    snippetCount: this.snippetCount || "0",
    snippets: sortedSnippets || [],
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
