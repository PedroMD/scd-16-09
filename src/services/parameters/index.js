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
  app.use("/api/v1/parameters", service(options));

  // Get our initialize service to that we can bind hooks
  const parametersService = app.service("/api/v1/parameters");

  // Set up our before hooks
  parametersService.before(hooks.before);

  // Set up our after hooks
  parametersService.after(hooks.after);

  /**
  *
  */
  app.use("/api/v1/parameters/:parameterId/events/", {
    find (params, cb) {
      params.paginate = true;
      params.query = { paramId: params.parameterId };
      params.pleaseFormat = true;
      app.service("/api/v1/events").find(params)
      .then(events => {
        cb(null, events);
      })
      .catch(err => {
        cb(err, null);
      })
    },
    /**
    * Will delete all events 1 by 1, to leverage "events" hooks (which will then also remove the
    * relevant eventId from other services)
    */
    remove (id, params, cb) {
      // start by querying "events" for all its eventId where paramId is as specified
      params.query = { paramId: params.parameterId };
      // we're deleting the provider from params, so we can bypass events' before hooks.remove
      delete params.provider;
      params.paginate = true;
      app.service("/api/v1/events").find(params)
      .then(events => {
        let promises = [];
        events.forEach((event, index) => {
          promises.push(
            new Promise((resolve, reject) => {
              app.service("/api/v1/events").remove(event._id, params)
              .then(events => {
                resolve(events);
              })
              .catch(err => {
                reject(err);
              })
            })
          );
        })
        Promise.all(promises)
        .then(values => {
          console.log("VALUES", values);
          cb(null, events);
        }).catch(reason => {
          console.log(reason)
          cb(reason, null);
        });
      })
      .catch(err => {
        cb(err, null);
      })
    }
  })
};
