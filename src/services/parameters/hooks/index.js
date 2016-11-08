"use strict";

const hooks = require("feathers-hooks-common");

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
  create: [],
  update: [],
  patch: [],
  remove: []
};
