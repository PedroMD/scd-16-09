"use strict";

const hooks = require("feathers-hooks-common");
const globalHooks = require("../../../hooks");

/**
* Hook makes sure we're deleting a single resource only.
* If request is a DELETE /rules, then it responds with a 405.
* We can, however, issue a delete all from withing the API & tests, using services.
* @return {[type]} [description]
*/
const onlyIfSingleResourceOrInternal = function () {
  const disable = hooks.disable("external");
  const removeLinkedResources = globalHooks.removeLinkedResources("/api/v1/events", "paramId");
  return function (hook) {
    const result = hook.id !== null ? removeLinkedResources(hook) : disable(hook);
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
    onlyIfSingleResourceOrInternal()
  ]
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: [
  ]
};
