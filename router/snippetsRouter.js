"use strict";

const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const { Snippet } = require("./../models/snippet");

function getRequiredFields() {
  // The value is the user-friendly value we pass back, if we were going to do it that way, but here we have no reason to do so because we own front and back ends but just in case...
  return {
    owner: "Owner",
    category: "Category",
    snippetOrder: "Snippet Order",
    snippetText: "Snippet text"
  };
}

function checkForBadData(body) {
  const requiredFields = getRequiredFields();
  let message = "";

  for (var k in requiredFields) {
    if (requiredFields.hasOwnProperty(k)) {
      if (!(k in body)) {
        message += requiredFields[k] + ", ";
      } else {
        if (body[k].trim() === "") {
          message += requiredFields[k] + ", ";
        }
      }
    }
  }

  if (message > "") {
    message = message.slice(0, -2); // remove last comma and space
    // message = "Please correct: " + message;
    message = `Please correct: Required field(s) - ${message} - is(/are) missing from request body.`;
  }
  return message;
}

// Create a snippet
router.post("/add-snippet", jsonParser, (req, res) => {
  let message = checkForBadData(req.body);
  if (!(message === "")) {
    return res.status(400).send(message);
  }

  let { owner, category, snippetOrder, snippetText } = req.body;

  return Snippet.find({ owner: req.body.owner, category: req.body.category, snippetText: req.body.snippetText })
    .count()
    .then(count => {
      if (count > 0) {
        // User already exists
        return Promise.reject({
          code: 422,
          reason: "ValidationError",
          message: "Cannot save a snippet that is identical to one that already exists.",
          location: "snippet"
        });
      }
      return req.body;
    })
    .then(snippet => {
      let category = snippet.category || "uncategorized";
      let snippetOrder = snippet.snippetOrder || "2";
      return Snippet.create({ owner: snippet.owner, category, snippetText: snippet.snippetText, snippetOrder });
    })
    .then(snippet => {
      return res.status(201).json(snippet);
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened but we don't want to expose
      // info about our system to possibly nefarious users
      if (err.reason === "ValidationError") {
        return res.status(err.code).json(err);
      }
      res.status(500).json({ code: 500, message: "Internal server error" });
    });
});

module.exports = router;
