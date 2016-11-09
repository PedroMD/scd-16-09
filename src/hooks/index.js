"use strict";

/**
* Conditional hook determining whether hook.result should be formated.
* Will always format if original request came from any special route
* @return {boolean} [true if needs formating; false if not]
*/
exports.needsFormat = function () {
  return function (hook) {
    // check if any route has set the "pleaseFormat" property to true
    if (hook.params.hasOwnProperty("pleaseFormat")) {
      return true;
    } else {
      return false;
    }
  }
}

/**
* [removeLinkedResources description]
* @return {[type]} [description]
*/
exports.removeLinkedResources = function (service, property) {
  return function (hook) {
    return new Promise((resolve, reject) => {
      console.log("REMOVELINKEDRESOURCES");
      hook.params.query = {
        [property]: hook.id
      };
      // console.log("HOOK.PARAMS.QUERY", hook.params.query)
      hook.app.service(service).remove(null, hook.params)
      // .then(() => hook)
      .then(() => {
        // just a flag indicating we've succesfully removed the link alerts
        // useful for other after hooks (pullIdFromUser() for instance from rules' hooks)
        hook.params.removedLinkedAlerts = true;
        delete hook.params.query;
        return resolve(hook);
      })
      .catch(err => {
        return reject(err);
      })
    })
  }
}
