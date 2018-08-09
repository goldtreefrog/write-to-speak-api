"use strict";

const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const { RegisteredUser } = require("./../models/user");
const { Snippet } = require("./../models/snippet");

function getRequiredFields(includeUpdatedAt = false) {
  // The value is the user-friendly value we pass back, if we were going to do it that way...
  let requiredFields = {
    owner: "Owner",
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
      // Snippet.find({}).then(snippets => {
      console.log("snippets length in get all snippets: ", snippets.length);
      if (snippets.length < 1) {
        return res.status(404).send("No snippets found");
      }
      return res.status(200).json(snippets);
    });
});

// Get snippets for one owner
// router.get("/find/:id", jsonParser, (req, res) => {
//   CreatureSighting.findOne({ _id: req.params.id })
//     .then(creatureSightings => {
//       res.json({ creatureSightings });
//     })

router.get("/owner/:owner", jsonParser, (req, res) => {
  // console.log("***!!!req.params.owner: ", req.params.owner);
  // RegisteredUser.findById(req.params.owner.toString())
  // let id = req.params.owner;
  RegisteredUser.findById(req.params.owner)
    // .populate("snippets")
    .then(user => {
      // Snippet.find({ owner: req.params.owner }).then(snippets => {
      // console.log("****find one user: ", user);
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

// Create a snippet
router.post("/add-snippet", jsonParser, (req, res) => {
  let message = checkForBadData(req.body);
  if (!(message === "")) {
    return res.status(400).send(message);
  }

  let { owner, category, snippetOrder, snippetText } = req.body;

  return Snippet.find({ owner: req.body.owner, category: req.body.category, snippetText: req.body.snippetText })
    .countDocuments()
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
