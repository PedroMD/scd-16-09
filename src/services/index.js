"use strict";

const alerts = require("./alerts");
const rules = require("./rules");
const parameters = require("./parameters");
const events = require("./events");
const authentication = require("./authentication");
const user = require("./user");
const mongoose = require("mongoose");

module.exports = function () {
  const app = this;

  mongoose.connect(app.get("mongodb"));
  mongoose.Promise = global.Promise;

  app.configure(authentication);
  app.configure(user);
  app.configure(events);
  app.configure(parameters);
  app.configure(rules);
  app.configure(alerts);
};
