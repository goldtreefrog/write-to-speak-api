"use strict";

const mongoose = require("mongoose");

// Schema for a snippet
const SnippetSchema = mongoose.Schema({
  // owner: { type: String, required: [true, "Owner is required"], trim: true },
  category: { type: String, required: [true, "Category is required"], trim: true },
  snippetOrder: { type: Number, required: [true, "Snippet order is required"] },
  snippetText: { type: String, required: [true, "Snippet text is required"], trim: true }
  // },
  // {
  //   timestamps: true
});

// const Snippet = mongoose.model("Snippet", snippetSchema);

module.exports = { SnippetSchema };
