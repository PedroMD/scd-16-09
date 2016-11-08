"use strict";

const assert = require("assert");
const app = require("../../../src/app");

describe("parameters service", function () {
  it("registered the parameters service", () => {
    assert.ok(app.service("parameters"));
  });
});
