"use strict";

const hooks = require("feathers-hooks-common");
const globalHooks = require("../../../hooks");

/**
* A chained hook which takes the previously converted hook.result at @format(), to the following structure (example):
* [
   {
      "name":"pressure",
      "units":"Pa",
      "events":[
         {
            "value":104,
            "timestamp":"2016-11-07T22:18:53.467Z"
         },
         {
            "value":135,
            "timestamp":"2016-11-07T22:18:53.468Z"
         },
         {
            "value":65,
            "timestamp":"2016-11-07T22:18:53.468Z"
         },
         {
            "value":80,
            "timestamp":"2016-11-07T22:18:53.469Z"
         }
      ],
      "threshold":50
   },
   {
      "name":"temperature",
      "units":"K",
      "events":[
         {
            "value":148,
            "timestamp":"2016-11-07T22:18:53.469Z"
         }
      ],
      "threshold":100
   }
]
* @return {object} hook resolves the hook obj once formated
*/
const sortByParameters = function () {
  return function (hook) {
    return new Promise((resolve, reject) => {
      let alertsParamsIds = []; // every param (id & name) included in this alerts list
      let uniqueParams = [];
      hook.result.forEach((alert, index) => {
        // first create the unique params
        if (alertsParamsIds.indexOf(alert.paramId._id.toString()) === -1) {
          alertsParamsIds.push(alert.paramId._id.toString())
          uniqueParams.push({
            name: alert.paramId.name,
            units: alert.paramId.units,
            threshold: alert.rule.threshold,
            events: []
          })
        }
      })
      // then fill out those unique params with the corresponding events
      alertsParamsIds.forEach((param, index) => {
        hook.result.forEach((alert, alertIndex) => {
          if (alert.paramId._id.toString() === param.toString()) {
            uniqueParams[index].events.push({
              value: alert.event.value,
              timestamp: alert.event.timestamp
            })
          }
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
const format = function () {
  return function (hook) {
    return new Promise((resolve, reject) => {
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
        console.log("[format - sortByParamsName] - Error fetching param", err)
        return reject("[format - sortByParamsName] - Error fetching param", err)
      })
    })
  }
}

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [
    hooks.iff(hooks.isProvider("external"), hooks.disable("external"))
  ],
  update: [
    hooks.iff(hooks.isProvider("external"), hooks.disable("external"))
  ],
  patch: [
    hooks.iff(hooks.isProvider("external"), hooks.disable("external"))
  ],
  remove: [
    // hooks.iff(hooks.isProvider("external"), hooks.disable("external"))
  ]
};

exports.after = {
  all: [],
  find: [
    hooks.populate("rule", { field: "ruleId", service: "/api/v1/rules" }),
    hooks.populate("event", { field: "eventId", service: "/api/v1/events" }),
    hooks.iff(globalHooks.needsFormat(), hooks.populate("paramId", { field: "paramId", service: "/api/v1/parameters" })),
    hooks.iff(globalHooks.needsFormat(), format())
  ],
  get: [
    hooks.populate("rule", { field: "ruleId", service: "/api/v1/rules" }),
    hooks.populate("event", { field: "eventId", service: "/api/v1/events" }),
    hooks.iff(globalHooks.needsFormat(), format())
  ],
  create: [],
  update: [],
  patch: [],
  remove: []
};
