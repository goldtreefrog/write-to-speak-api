"use strict";

const mongoose = require("mongoose");

// Schema for a snippet
const snippetSchema = mongoose.Schema(
  {
    owner: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    snippetOrder: { type: Number, required: true },
    snippetText: { type: String, required: true, trim: true }
  },
  {
    timestamps: true
  }
);

const Snippet = mongoose.model("Snippet", snippetSchema);

module.exports = { Snippet };
