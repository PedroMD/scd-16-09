"use strict";

const assert = require("assert");
const app = require("../../../src/app");

describe("rules service", function () {
  it("registered the rules service", () => {
    assert.ok(app.service("rules"));
  });
});
