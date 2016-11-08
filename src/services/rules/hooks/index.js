"use strict";

const hooks = require("feathers-hooks-common");

/**
* Pushes the resulting "_id" to that user's rulesIds[]
*/
const addIdToUser = function () {
  return function (hook) {
    if (hook.result instanceof Array) {
      // Original POST body had an array of rules
      // Loop all of them, and push the resulting _id to user's rulesIds[]
      hook.result.forEach((rule, index) => {
        return hook.app.service("users").patch(rule.userId, {
          $push: {rulesIds: rule._id}
        })
        .then(user => {
          return hook;
        })
        .catch(err => {
          console.log("ERR", err)
          return err;
        })
      })
    } else {
      // Original POST body had 1 rule only
      hook.app.service("users").patch(hook.result.userId, {
        $push: {rulesIds: hook.result._id}
      })
      .then(user => {
        return hook;
      })
      .catch(err => {
        console.log("ERR", err)
        return err;
      })
    }
  };
};

/**
* [removeLinkedAlerts description]
* @return {[type]} [description]
*/
const removeLinkedAlerts = function () {
  return function (hook) {
    // console.log("REMOVELINKEDALERTS");
    hook.params.query = {
      ruleId: hook.id
    };
    hook.app.service("alerts").remove(null, hook.params)
    .then(() => hook)
    .catch(err => {
      return err;
    })
  }
}

/**
* Hook makes sure we're deleting a single resource only.
* If request is a DELETE /rules, then it responds with a 405.
* We can, however, issue a delete all from withing the API & tests, using services.
* @return {[type]} [description]
*/
const onlyIfSingleResource = function () {
  const disable = hooks.disable("external");
  const removeAlerts = removeLinkedAlerts();
  return function (hook) {
    const result = hook.id !== null ? removeAlerts(hook) : disable(hook);
    return Promise.resolve(result).then(() => hook);
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
    onlyIfSingleResource()
  ]
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [
    addIdToUser()
  ],
  update: [],
  patch: [],
  remove: []
};
