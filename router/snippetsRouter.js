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
  console.log(requiredFields);
  let message = "";

  for (var k in requiredFields) {
    if (requiredFields.hasOwnProperty(k)) {
      if (!(k in body)) {
        console.log("missing field: ", requiredFields[k]);
        message += requiredFields[k] + ", ";
      } else {
        if (body[k].trim() === "") {
          console.log("blank field: ", requiredFields[k]);
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
  console.log("inside /add-snippet route with req: ", req.body);
  let message = checkForBadData(req.body);
  if (!(message === "")) {
    console.log("Error message returned from checkForBadData: ", message);
    return res.status(400).send(message);
  }

  let { owner, category, snippetOrder, snippetText } = req.body;
  console.log("Request fields: ", owner, category, snippetOrder, snippetText);

  return Snippet.find({ owner: req.body.owner, category: req.body.category, snippetText: req.body.snippetText })
    .count()
    .then(count => {
      if (count > 0) {
        // User already exists
        console.log(req.body.owner, req.body.category, req.body.snippetText, " already exists");
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
      console.log("after we checked to be sure this wouldn't be a duplicate: ", snippet, " *******  order: ", snippet.snippetOrder);
      let category = snippet.category || "uncategorized";
      let snippetOrder = snippet.snippetOrder || "2";
      return Snippet.create({ owner: snippet.owner, category, snippetText: snippet.snippetText, snippetOrder });
    })
    .then(snippet => {
      console.log("Message from snippetsRouter.js: So it got created?");
      return res.status(201).json(snippet);
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened but we don't want to expose
      // info about our system to possibly nefarious users
      console.log("Oh no!", err);
      if (err.reason === "ValidationError") {
        return res.status(err.code).json(err);
      }
      res.status(500).json({ code: 500, message: "Internal server error" });
    });
});

module.exports = router;
