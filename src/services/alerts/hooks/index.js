"use strict";

const hooks = require("feathers-hooks-common");

/**
 * A chained hook which takes the previously converted hook.result at @formatAlerts(), to the following structure (example):
 * [
  {
    "name": "pressure",
    "units": "Pa",
    "alerts": [
      {
        "value": 104,
        "timestamp": "2016-11-07T22:18:53.467Z"
      },
      {
        "value": 135,
        "timestamp": "2016-11-07T22:18:53.468Z"
      },
      {
        "value": 65,
        "timestamp": "2016-11-07T22:18:53.468Z"
      },
      {
        "value": 80,
        "timestamp": "2016-11-07T22:18:53.469Z"
      }
    ],
    "threshold": 50
  },
  {
    "name": "temperature",
    "units": "K",
    "alerts": [
      {
        "value": 148,
        "timestamp": "2016-11-07T22:18:53.469Z"
      }
    ],
    "threshold": 100
  }
]
* @return {Promise} promise resolves the hook obj once formated
*/
const sortByParameters = function () {
  return function (hook) {
    return new Promise((resolve, reject) => {
      let alertsParamsIds = []; // every param (id & name) included in this alerts list
      let uniqueParams = [];
      hook.result.forEach((alert, index) => {
        if (alertsParamsIds.indexOf(alert.paramId._id.toString()) === -1) {
          alertsParamsIds.push(alert.paramId._id.toString())
          uniqueParams.push({
            name: alert.paramId.name,
            units: alert.paramId.units,
            alerts: [],
            threshold: alert.rule.threshold
          })
        }
        uniqueParams[uniqueParams.length - 1].alerts.push({
          value: alert.event.value,
          timestamp: alert.event.timestamp
        })
      })
      hook.result = uniqueParams;
      return resolve(hook);
    })
  }
}

/**
* Hook func which is conditionally called IF @needsFormat() returned true.
* Simply makes sure hook.result is always array, whether initial request was GET or FIND. Works as a pre-format to @sortByParameters()
* @return {[type]} [description]
*/
const formatAlerts = function () {
  return function (hook) {
    return new Promise((resolve, reject) => {
      console.log("FORMATALERTS")
      let results = [];
      if (hook.result instanceof Array) {
        hook.result.forEach((result) => {
          results.push(result);
        })
      } else {
        results.push(hook.result);
      }
      hook.result = results;
      sortByParameters()(hook)
      .then(hook => {
        return resolve(hook);
      })
      .catch(err => {
        console.log("[formatAlerts - sortByParamsName] - Error fetching param", err)
        return reject("[formatAlerts - sortByParamsName] - Error fetching param") // TODO:70 send error
      })
    })
  }
}

/**
 * Conditional hook determining whether hook.result should be formated.
 * Will always format if original request came from /users/{userId}/alerts
 * @return {boolean} [true if needs formating; false if not]
 */
const needsFormat = function () {
  return function (hook) {
    // check if it came from /users/{userId}/alerts
    if (hook.params.hasOwnProperty("formatUsersAlerts")) {
      return true;
    } else {
      return false;
    }
  }
}

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: [
    hooks.populate("rule", { field: "ruleId", service: "/rules" }),
    hooks.populate("event", { field: "eventId", service: "/events" }),
    hooks.iff(needsFormat(), hooks.populate("paramId", { field: "paramId", service: "/parameters" })),
    hooks.iff(needsFormat(), formatAlerts())
  ],
  get: [
    hooks.populate("rule", { field: "ruleId", service: "/rules" }),
    hooks.populate("event", { field: "eventId", service: "/events" }),
    hooks.iff(needsFormat(), formatAlerts())
  ],
  create: [],
  update: [],
  patch: [],
  remove: []
};
