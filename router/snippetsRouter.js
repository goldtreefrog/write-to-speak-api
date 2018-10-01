"use strict";

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { router: authRouter, jwtStrategy, jwtAuth } = require("./../auth");
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

router.use(jsonParser);

// Get snippets for all owners (something only administrators should be able to do...)
router.get("/all", jwtAuth, (req, res) => {
  let totalSnippets = 0;
  RegisteredUser.find({}).then(users => {
    const filteredUsers = users.filter(user => {
      if (user.snippetCount) {
        totalSnippets += user.snippetCount;
        return true;
      }
    });
    const usersWithSnippets = filteredUsers.map(user => user.serialize());
    return res.status(200).json({ totalSnippets, usersWithSnippets });
  });
});

// Get snippets for one owner
router.get("/owner", jwtAuth, (req, res) => {
  RegisteredUser.findById(req.body._id).then(user => {
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
router.put("/add-snippet", jwtAuth, (req, res) => {
  let message = checkForBadData(req.body);
  if (!(message === "")) {
    return res.status(400).json({ message });
  }

  // Future: Ideally should add a check to make sure the identical snippet (same category too) does not already exist.
  let { userId, category, snippetOrder, snippetText } = req.body;
  RegisteredUser.findById(mongoose.Types.ObjectId(req.body.userId)).then(
    user => {
      // If user logout is later than login, user needs to log in again and cannot add this snippet until that happens.
      if (user.lastLogin < user.lastLogout) {
        return res.status(401).json({ message: "Please sign in again." });
      }

      let snippets = user.snippets;
      snippets.push({
        category: req.body.category,
        snippetText: req.body.snippetText,
        snippetOrder: req.body.snippetOrder
      });
      return (
        user
          .save()

          // return RegisteredUser.findByIdAndUpdate(req.body.userId, {
          //   snippets: snippets
          // })
          .then(user => {
            return res.status(200).json(user.snippets);
            // return res.status(204).end();
          })
      );
    }
  );
});

router.put("/update-snippet", jsonParser, (req, res) => {
  let message = "";
  RegisteredUser.findById(req.body.userId)
    .then(user => {
      // If user logout is later than login, user needs to log in again and cannot update this snippet until that happens.
      if (user.lastLogin < user.lastLogout) {
        return res.status(401).json({ message: "Please sign in again." });
      }

      const snippetToUpdate = user.snippets.id(req.body.snippet.snippetId);
      let category = req.body.snippet.category || snippetToUpdate.category;
      let snippetText =
        req.body.snippet.snippetText || snippetToUpdate.snippetText;
      let snippetOrder =
        req.body.snippet.snippetOrder || snippetToUpdate.snippetOrder;
      let snippet = {
        _id: req.body.snippet.snippetId,
        category,
        snippetText,
        snippetOrder
      };
      snippetToUpdate.set(snippet);
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
      // If user logout is later than login, user needs to log in again and cannot update this snippet until that happens.
      if (user.lastLogin < user.lastLogout) {
        return res.status(401).json({ message: "Please sign in again." });
      }

      user.snippets.pull(req.body.snippetId);
      user.save();
    })
    .then(function() {
      res.status(204).end();
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        message: `Internal server error. Record not deleted. Error: ${err}`
      });
    });
});

module.exports = router;
