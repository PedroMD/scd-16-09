"use strict";

const service = require("feathers-mongoose");
const parameters = require("./parameters-model");
const hooks = require("./hooks");

module.exports = function () {
  const app = this;

  const options = {
    Model: parameters,
    paginate: false,
    lean: true
  };

  // Initialize our service with any options it requires
  app.use("/parameters", service(options));

  // Get our initialize service to that we can bind hooks
  const parametersService = app.service("/parameters");

  // Set up our before hooks
  parametersService.before(hooks.before);

  // Set up our after hooks
  parametersService.after(hooks.after);
};
