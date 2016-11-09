"use strict";

const hooks = require("feathers-hooks");
const auth = require("feathers-authentication").hooks;

exports.before = {
  all: [],
  find: [
    // auth.verifyToken(),
    // auth.populateUser(),
    // auth.restrictToAuthenticated()
  ],
  get: [],
  create: [
    // auth.hashPassword()
  ],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [hooks.remove("password")],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
