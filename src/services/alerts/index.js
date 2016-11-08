"use strict";

const service = require("feathers-mongoose");
const alerts = require("./alerts-model");
const hooks = require("./hooks");

module.exports = function() {
  const app = this;

  const options = {
    Model: alerts,
    paginate: false,
    lean: true
  };

  // Initialize our service with any options it requires
  app.use("/alerts", service(options));

  // Get our initialize service to that we can bind hooks
  const alertsService = app.service("/alerts");

  // Set up our before hooks
  alertsService.before(hooks.before);

  // Set up our after hooks
  alertsService.after(hooks.after);
};
