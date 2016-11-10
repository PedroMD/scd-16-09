"use strict";

const service = require("feathers-mongoose");
const alerts = require("./alerts-model");
const hooks = require("./hooks");

module.exports = function () {
  const app = this;

  const options = {
    Model: alerts,
    // paginate: false,
    paginate: {
      default: 25,
      max: 50
    },
    lean: true
  };

  // Initialize our service with any options it requires
  app.use("/api/v1/alerts", service(options));

  // Get our initialize service to that we can bind hooks
  const alertsService = app.service("/api/v1/alerts");

  // Set up our before hooks
  alertsService.before(hooks.before);

  // Set up our after hooks
  alertsService.after(hooks.after);
};
