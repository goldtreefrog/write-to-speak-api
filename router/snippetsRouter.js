"use strict";

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const { RegisteredUser } = require("./../models/user");
const { Snippet } = require("./../models/snippet");

function getRequiredFields(includeUpdatedAt = false) {
  // The value is the user-friendly value we pass back, if we were going to do it that way...
  let requiredFields = {
    userId: "Registered User Id",
    category: "Category",
    snippetOrder: "Snippet Order",
    snippetText: "Snippet Text"
  };
  if (includeUpdatedAt) {
    requiredFields.updatedAt = "Last Updated";
  }
  return requiredFields;
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
    message = `Please correct: Required field(s) - ${message} - is(/are) missing from request body.`;
  }
  return message;
}

// Get snippets for all owners (something only administrators should be able to do...)
router.get("/all", jsonParser, (req, res) => {
  RegisteredUser.find({})
    .populate("snippets")
    .then(snippets => {
      console.log("snippets length in get all snippets: ", snippets.length);
      if (snippets.length < 1) {
        return res.status(404).send("No snippets found");
      }
      return res.status(200).json(snippets);
    });
});

// Get snippets for one owner
router.get("/owner/:owner", jsonParser, (req, res) => {
  RegisteredUser.findById(req.params.owner).then(user => {
    if (!user) {
      return res.status(404).send("Owner does not exist in our system");
    }
    if (!user.snippets) {
      console.log("No snippets? 1");
      return res.status(404).send("No snippets found for this owner");
    }
    return res.status(200).json(user.snippets);
  });
});

// Create a snippet (entry in subdocument array) for existing user
router.put("/add-snippet", jsonParser, (req, res) => {
  let message = checkForBadData(req.body);
  if (!(message === "")) {
    console.log("message: ", message);
    return res.status(400).json({ message });
  }

  let { userId, category, snippetOrder, snippetText } = req.body;
  RegisteredUser.findById(mongoose.Types.ObjectId(req.body.userId))
    .then(user => {
      let snippets = user.snippets;
      snippets.push({ category: req.body.category, snippetText: req.body.snippetText, snippetOrder: req.body.snippetOrder });
      return RegisteredUser.findByIdAndUpdate(req.body.userId, { snippets: snippets });
    })
    .then(user => {
      return res.status(200).json(user);
    });
});

router.put("/:id", jsonParser, (req, res) => {
  let message = "";
  const requiredFields = getRequiredFields(true);

  // Works in ES2016 and later:
  Object.keys(req.body).forEach(function(key) {
    if (req.body[key].trim() === "" && key in requiredFields) {
      message += key + ", ";
    }
  });

  if (message.length > 0) {
    message = "Cannot update. Required fields are missing: " + message;
    return res.status(400).send(message);
  }

  return Snippet.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then(snippet => {
      return res.status(200).json(snippet); // 204 means no content
    })
    .catch(err => {
      res.status(500).json({
        message: `Internal server error. Record not updated. Error: ${err}`
      });
    });
});

router.delete("/:id", jsonParser, (req, res) => {
  let id = req.params.id;
  console.log(`Delete item ${id}`);

  Snippet.remove({ _id: id })
    .then(function() {
      res.status(204).end();
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({ message: `Internal server error. Record not deleted. Error: ${err}` });
    });
});

module.exports = router;
