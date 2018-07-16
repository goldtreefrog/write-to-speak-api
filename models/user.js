"use strict";

const mongoose = require("mongoose");

// Schema for a user
const registeredUserSchema = mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: 1 },
    password: { type: String, required: true, trim: true, minlength: 6 }
  },
  {
    timestamps: true
  }
);

const RegisteredUser = mongoose.model("RegisteredUser", registeredUserSchema);

module.exports = { RegisteredUser };
