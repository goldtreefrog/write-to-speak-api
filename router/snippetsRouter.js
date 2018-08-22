"use strict";

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const { RegisteredUser } = require("./../models/user");
const { Snippet } = require("./../models/snippetSchema");

function getRequiredFields() {
  // The value is the user-friendly value we pass back, if we were going to do it that way...
  let requiredFields = {
    userId: "Registered User Id",
    category: "Category",
    snippetOrder: "Snippet Order",
    snippetText: "Snippet Text"
  };
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
  let totalSnippets = 0;
  RegisteredUser.find({}).then(users => {
    const filteredUsers = users.filter(user => {
      if (user.snippetCount) {
        totalSnippets += user.snippetCount;
        // console.log("serial inside router: ", user.serialize());
        return true;
      }
    });
    const usersWithSnippets = filteredUsers.map(user => user.serialize());
    return res.status(200).json({ totalSnippets, usersWithSnippets });
  });
});

// Get snippets for one owner
router.get("/owner/:owner", jsonParser, (req, res) => {
  RegisteredUser.findById(req.params.owner).then(user => {
    if (!user) {
      return res.status(404).send("Owner does not exist in our system");
    }
    if (!user.snippets) {
      return res.status(404).send("No snippets found for this owner");
    }
    return res.status(200).json(user.snippets);
  });
});

// Create a snippet (entry in subdocument array) for existing user
router.put("/add-snippet", jsonParser, (req, res) => {
  let message = checkForBadData(req.body);
  if (!(message === "")) {
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

router.put("/update-snippet", jsonParser, (req, res) => {
  let message = "";
  RegisteredUser.findById(req.body.userId)
    .then(user => {
      const snippet = user.snippets.id(req.body.snippetId);
      snippet.set(req.body.snippet);
      return user.save();
    })
    .then(user => {
      return res.status(200).json(user.snippets);
    })
    .catch(err => {
      res.status(500).json({
        message: `Internal server error. Record not updated. Error: ${err}`
      });
    });
});

router.put("/delete-snippet", jsonParser, (req, res) => {
  RegisteredUser.findById(req.body.userId)
    .then(user => {
      user.snippets.pull(req.body.snippetId);
      user.save();
    })
    .then(function() {
      res.status(204).end();
    })
    .catch(err => {
      res.status(500).json({ message: "Internal server error. Snippet not deleted." });
    });
});

module.exports = router;
