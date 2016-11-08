"use strict";

const assert = require("assert");
const app = require("../../../src/app");

describe("alerts service", function () {
  it("registered the alerts service", () => {
    assert.ok(app.service("alerts"));
  });
});
