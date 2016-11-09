"use strict";

const hooks = require("feathers-hooks-common");
const globalHooks = require("../../../hooks");

/**
* Saves the generated _ids accordingly:
* always $push to user's rulesIds[] IF original request was not PUT /users/{userId}/rules -
* in the last case, use $set, to override any previously saved ids.
*/
const saveIds = function (idsToPatch, idsToSave) {
  return function (hook) {
    let promises = [];
    // params.setIds is used at PUT /users/{userId}/rules to tell this hook to use $set instead
    if (hook.params.hasOwnProperty("setIds")) {
      idsToPatch.forEach((idToPatch, index1) => {
        promises.push(
          new Promise((resolve, reject) => {
            hook.app.service("users").patch(idToPatch, {
              $set: {rulesIds: idsToSave}
            })
            .then(() => hook)
            .catch(err => err)
          })
        );
      })
    } else {
      idsToPatch.forEach((idToPatch, index) => {
        promises.push(
          new Promise((resolve, reject) => {
            hook.app.service("users").patch(idToPatch, {
              $push: {rulesIds: idsToSave[index]}
            })
            .then(() => hook)
            .catch(err => err)
          })
        );
      })
    }
    Promise.all(promises)
    .then(values => {
      console.log("VALUES", values);
      return hook;
    }).catch(reason => {
      console.log(reason)
      return reason;
    });
  }
}

/**
 * Simply constructs two arrays (idsToPatch & idsToSave) regardless of the original request (GET or FIND)
 * Then it calls out saveIds()
 * @return {object} hook  the hook object
 */
const prepareIdsToSave = function () {
  return function (hook) {
    let idsToPatch = [];
    let idsToSave = [];
    if (hook.result instanceof Array) {
      // Original POST body had an array of rules
      // Loop all of them, and push the resulting _id to user's rulesIds[]
      hook.result.forEach((rule, index) => {
        idsToPatch.push(rule.userId)
        idsToSave.push(rule._id)
      })
    } else {
      // Original POST body had 1 rule only
      idsToPatch.push(hook.result.userId)
      idsToSave.push(hook.result._id)
    }
    let result = saveIds(idsToPatch, idsToSave)(hook)
    return Promise.resolve(result).then(() => hook);
  };
};

/**
* Hook makes sure we're deleting a single resource only.
* If request is a DELETE /rules, then it responds with a 405.
* We can, however, issue a delete all from withing the API & tests, using services.
* @return {[type]} [description]
*/
const onlyIfSingleResourceOrInternal = function () {
  const disable = hooks.disable("external");
  const removeLinkedResources = globalHooks.removeLinkedResources("alerts", "ruleId");
  return function (hook) {
    const result = hook.id !== null ? removeLinkedResources(hook) : disable(hook);
    return Promise.resolve(result).then(() => hook);
  }
}

/**
 * This hook simply pulls the removed rule out of the corresponding users's rulesIds[]
 * @return {object} hook  the hook obj
 */
const pullIdFromUser = function () {
  return function (hook) {
    if (hook.params.hasOwnProperty("removedLinkedAlerts")) {
      // console.log("HOOK", hook)
      // then we know globalHooks.removeLinkedResources("alerts", "ruleId") has ran,
      // so we are ok to proceed
      hook.app.service("users").patch(hook.result.userId, {
        $pull: {rulesIds: hook.id}
      })
      .then(() => hook)
      .catch(err => err)
    } else {
      return hook;
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
  remove: [
    onlyIfSingleResourceOrInternal()
  ]
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [
    prepareIdsToSave()
  ],
  update: [],
  patch: [],
  remove: [
    pullIdFromUser()
  ]
};
