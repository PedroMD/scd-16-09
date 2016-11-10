"use strict";

const hooks = require("feathers-hooks-common");
const globalHooks = require("../../../hooks");

/**
* A chained hook which takes the previously converted hook.result at @formatAlerts(), to the following structure (example):
* {
  "name": "pressure",
  "units": "Pa",
  "events": [
    {
      "value": 78,
      "timestamp": "2016-11-08T23:37:04.376Z"
    },
    {
      "value": 84,
      "timestamp": "2016-11-08T23:37:04.379Z"
    },
    {
      "value": 46,
      "timestamp": "2016-11-08T23:37:04.380Z"
    },
    {
      "value": 111,
      "timestamp": "2016-11-08T23:37:04.380Z"
    }
  ]
}
* @return {object} hook the hook object
*/
const format = function () {
  return function (hook) {
    let result = {};
    result.name = hook.result[0].paramId.name;
    result.units = hook.result[0].paramId.units;
    result.events = [];
    hook.result.forEach((event, index) => {
      result.events.push({
        value: event.value,
        timestamp: event.timestamp
      })
    })
    hook.result = result;
    return hook;
  }
}

/**
* Hook makes sure we're deleting a single resource only.
* If request is a DELETE /rules, then it responds with a 405.
* We can, however, issue a delete all from withing the API & tests, using services.
* @return {[type]} [description]
*/
const onlyIfSingleResourceOrInternal = function () {
  const disable = hooks.disable("external");
  const removeLinkedResources = globalHooks.removeLinkedResources("/api/v1/alerts", "eventId");
  return function (hook) {
    const result = hook.id !== null ? removeLinkedResources(hook) : disable(hook);
    return Promise.resolve(result).then(() => hook);
  }
}

// TODO:50 - clean this hooks into smaller more explicit ones (break callback hell)
const checkForRule = function (event) {
  return function (hook) {
    return new Promise((resolve, reject) => {
      hook.app.service("/api/v1/users").find()
      .then(users => {
        users.forEach((user, indexUsers) => {
          user.rulesIds.forEach((rule, indexRules) => {
            hook.app.service("/api/v1/rules").get(rule)
            .then(rule => {
              if (rule.paramId.toString() === event.paramId.toString()) {
                // console.log("CONDITION PASSED - THERE IS A RULE FOR THIS PARAM")
                if (event.value > rule.threshold) {
                  // console.log("CONDITION PASSED - ALERT!")
                  delete hook.params.provider;
                  hook.app.service("/api/v1/alerts").create({
                    userId: user._id,
                    ruleId: rule._id,
                    paramId: event.paramId,
                    eventId: event._id
                  })
                  .then(alert => {
                    // console.log("[checkForRule] Created alert", alert);
                    if (indexUsers === users.length - 1 && indexRules === user.rulesIds.length) {
                      // this indicates we've looped through all users & their respective rules, so we can now resolve this promise
                      return resolve(hook);
                    }
                  })
                  .catch(err => {
                    console.log("[checkForRule] Error creating alert", err);
                    return reject(err)
                  })
                } else { // the rule exists for this param, but it does not pass its threshold's level
                  return resolve(hook);
                }
              } else { // there are no rules for this param
                return resolve(hook);
              }
            })
            .catch(err => {
              console.log("[checkForRule] - Error fetching a user's rule", err);
              return reject(err);
            })
          })
        })
      })
      .catch(err => {
        console.log("[checkForRule] - Error finding all users", err);
        return reject(err);
      })
    })
  }
}

const checkForRules = function () {
  return function (hook) {
    return new Promise((resolve, reject) => {
      let promises = [];
      if (hook.result instanceof Array) {
        // Events were POST'd inside an array (more than 1)
        hook.result.forEach((event, index) => {
          promises.push(
            checkForRule(event)(hook)
            .then(hook => {
              // console.log("[checkForRule] returned hm.result:", hm.result);
              return resolve(hook)
            })
            .catch(err => {
              console.log("[checkForRule] returned ERR:", err)
              return reject(err)
            })
          )
        })
      } else {
        // Only 1 Event was POST'd
        promises.push(
          checkForRule(hook.result)(hook)
          .then(hook => {
            return resolve(hook)
          })
          .catch(err => {
            console.log("[checkForRule] returned ERR:", err)
            return reject(err)
          })
        )
      }
      Promise.all(promises)
      .then(value => {
        return resolve(hook)
      }, reason => {
        console.log("Error while creating alerts: ", reason)
        return reject(hook)
      });
    })
  }
}

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: [
    onlyIfSingleResourceOrInternal()
  ]
};

exports.after = {
  all: [],
  find: [
    hooks.iff(globalHooks.needsFormat(), hooks.populate("paramId", { field: "paramId", service: "/api/v1/parameters" })),
    hooks.iff(globalHooks.needsFormat(), format())
  ],
  get: [],
  create: [
    checkForRules()
  ],
  update: [],
  patch: [],
  remove: []
};
