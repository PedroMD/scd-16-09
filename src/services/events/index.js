"use strict";

const service = require("feathers-mongoose");
const events = require("./events-model");
const hooks = require("./hooks");

module.exports = function () {
  const app = this;

  const options = {
    Model: events,
    // paginate: false,
    paginate: {
      default: 25,
      max: 50
    },
    lean: true
  };

  // Initialize our service with any options it requires
  app.use("/api/v1/events", service(options));

  // Get our initialize service to that we can bind hooks
  const eventsService = app.service("/api/v1/events");

  // Set up our before hooks
  eventsService.before(hooks.before);

  // Set up our after hooks
  eventsService.after(hooks.after);
};
