"use strict";

const service = require("feathers-mongoose");
const rules = require("./rules-model");
const hooks = require("./hooks");

module.exports = function () {
  const app = this;

  const options = {
    Model: rules,
    paginate: false,
    lean: true
  };

  // Initialize our service with any options it requires
  app.use("/api/v1/rules", service(options));

  // Get our initialize service to that we can bind hooks
  const rulesService = app.service("/api/v1/rules");

  // Set up our before hooks
  rulesService.before(hooks.before);

  // Set up our after hooks
  rulesService.after(hooks.after);
};
