"use strict";

const mongoose = require("mongoose");

// Schema for a user
const userSchema = mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    password: { type: String, required: true, trim: true }
  },
  {
    timestamps: true
  }
);
