"use strict";

const service = require("feathers-mongoose");
const user = require("./user-model");
const hooks = require("./hooks");
const errors = require("feathers-errors");

module.exports = function () {
  const app = this;

  const options = {
    Model: user,
    paginate: false,
    lean: true
  };

  // Initialize our service with any options it requires
  app.use("/users", service(options));

  // Get our initialize service to that we can bind hooks
  const userService = app.service("/users");

  // Set up our before hooks
  userService.before(hooks.before);

  // Set up our after hooks
  userService.after(hooks.after);

  /**
  * GET /users/{userId}/alerts
  * This route takes the userId and checks for all alerts which were triggered given the user's actual rulesIds.
  * It makes use of the "alerts" services, calling conditional hooks to properly format this particular request.
  */
  app.use("/users/:userId/alerts/", {
    find (params, cb) {
      app.service("users").get(params.userId, params)
      .then(user => {
        if (!user) {
          return cb(new errors.NotFound("User does not exist"), null);
        }
        params.query = {
          ruleId: {
            $in: user.rulesIds
          },
          userId: params.userId
        };
        // this will trigger a special hook on the service "alerts"
        params.pleaseFormat = true;
        app.service("alerts").find(params)
        .then(alerts => {
          console.log("ALERTS", alerts)
          cb(null, alerts);
        })
        .catch(err => {
          return cb(err, null);
          // return cb(new errors.GeneralError("Error querying alerts", {errors: err}));
        })
      })
      .catch(err => {
        return cb(err, null);
        // return cb(new errors.GeneralError("Error querying for a user", {errors: err}), null);
      })
    }
  })
  /**
  * POST /users/{userId}/rules
  * This route takes the userId from its parameters and creates rule(s) (assumed to be inside body), using
  * the "rules" service.
  * The resulting generated ruleId is stored in this user's rulesIds[] by the "rules" service's hooks.
  * There is no data validation as the ORM itself will take care of that, before saving it.
  */
  app.use("/users/:userId/rules/", {
    create (data, params, cb) {
      // adding userId prop to the body, so the "rules" service can properly save the rule(s)
      if (data instanceof Array) {
        // if multiple rules are to be created, insert the userId prop in every single obj
        data.forEach((rule) => {
          rule.userId = params.userId;
        })
      } else {
        data.userId = params.userId;
      }
      app.service("rules").create(data, params)
      .then(data => {
        // data is the created rule(s)
        cb(null, data);
      })
      .catch(err => {
        return cb(err, null);
      })
    },
    /**
    * GET /users/{userId}/rules
    * This route takes the userId from its parameters and fetches all rules that are currently stored under its rulesIds[] array.
    * The result is an array of rules, queried using the "rules" service.
    */
    find (params, cb) {
      // fetch the user first to get its rulesIds[]
      app.service("users").get(params.userId, params)
      .then(user => {
        let query = {
          _id: {
            $in: user.rulesIds
          }
        };
        app.service("rules").find({query: query}, params)
        .then(data => {
          // data contains this user's rule(s)
          cb(null, data);
        })
        .catch(err => {
          return cb(err, null);
        })
      })
      .catch(err => {
        return cb(err, null);
      })
    },
    /**
    * PUT /users/{userId}/rules
    * This route takes the userId from its parameters and creates rule(s) (assumed to be inside body), using
    * the "rules" service.
    * The resulting generated ruleId is stored in this user's rulesIds[] by the "rules" service's hooks.
    * There is no data validation as the ORM itself will take care of that, before saving it.
    * * NOTE:
    * - As it is a PUT, only these new incoming rules will be linked to the user. Any other existing rules will be removed from the user's userIds[].
    */
    update (id, data, params, cb) {
      // adding userId prop to the body, so the "rules" service can properly save the rule(s)
      if (data instanceof Array) {
        // if multiple rules are to be created, insert the userId prop in every single obj
        data.forEach((rule) => {
          rule.userId = params.userId;
        })
      } else {
        data.userId = params.userId;
      }
      // params.setIds will tell the "rules" service's hook to actually $set the generated _ids,
      // instead of $push, as this is a PUT. Only POST will add ($push) the resulting id.
      params.setIds = true;
      app.service("rules").create(data, params)
      .then(data => {
        // data is the created rule(s)
        cb(null, data);
      })
      .catch(err => {
        return cb(err, null);
      })
    }
  })
};
