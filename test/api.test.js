"use strict";

const assert = require("assert");
const request = require("request");
const app = require("../src/app");
const mockData = require("./mockData");
const helper = require("./fns.js");

/**
* Vars taken from config/default.json which determines how the tests will be processe
*/
const eventsToBeCreatedPerParam = app.get("testing").eventsToBeCreatedPerParam || 50;
const minValue = app.get("testing").minValue || 10;
const maxValue = app.get("testing").maxValue || 160;

/* Global vars */
let createdUsers = [];
let createdParams = [];
let paramEvents = [];
let paramThresholds = [];
let paramRules;
let eventsHigherThanThreshold;

/**
*       API TESTING
*/
describe("API Testing.", function () {
  // do not timeout at 2s (default) as we're generating & storing hundreds of events
  this.timeout(5000);
  before(function (done) {
    this.server = app.listen(3030);
    this.server.once("listening", () => done());
  });

  after(function (done) {
    // cleaning DB ...
    if (app.get("testing").cleanDB) {
      const services = ["/api/v1/users", "/api/v1/parameters", "/api/v1/rules", "/api/v1/events", "/api/v1/alerts"];
      let promises = [];
      for (let i = 0; i < services.length; i++) {
        promises.push(new Promise((resolve, reject) => {
          app.service(services[i]).remove(null)
          .then(res => {
            resolve(res)
          })
          .catch(err => {
            reject(err)
          });
        }));
      }
      Promise.all(promises)
      .then(value => {
        console.log("DB was cleaned");
        this.server.close(done);
      }, reason => {
        console.log("Error while cleaning DB: ", reason)
      });
    } else {
      this.server.close(done);
    }
  });

  /**
  *       Users
  */
  describe("Testing Users.", function () {
    describe(`Creating ${mockData.usersArray.length} Users.`, function () {
      it("returns code 201 & the users array", function (done) {
        request({
          url: "http://localhost:3030/api/v1/users",
          method: "POST",
          json: true,
          body: mockData.usersArray
        }, function (err, res, body) {
          assert.equal(res.statusCode, 201);
          assert.ok(body instanceof Array, true);
          assert.equal(body.length, mockData.usersArray.length);
          assert.ok(!body[0].hasOwnProperty("password"), true); // TODO:60 - verify in all users
          createdUsers = helper.saveGeneratedIds(body, "email");
          done(err);
        });
      });
    });
    describe(`Patching a single User`, function () {
      it("returns code 200 & the modified user obj", function (done) {
        // will change the first user's e-mai
        let changedUser = {};
        changedUser.email = "testing@mailcom";
        request({
          url: "http://localhost:3030/api/v1/users/" + createdUsers[0]._id,
          method: "PATCH",
          json: true,
          body: changedUser
        }, function (err, res, body) {
          assert.equal(res.statusCode, 200);
          assert.equal(body.email, changedUser.email);
          assert.equal(body._id, createdUsers[0]._id);
          assert.ok(body instanceof Object, true);
          assert.ok(!body.hasOwnProperty("password"), true);
          done(err);
        });
      });
    });
  });

  /**
  *       Parameters
  */
  describe("Testing Parameters.", function () {
    describe("Creating Parameters.", function () {
      it("returns code 201 & the created parameters array", function (done) {
        request({
          url: "http://localhost:3030/api/v1/parameters",
          method: "POST",
          json: true,
          body: mockData.parametersArray
        }, function (err, res, body) {
          assert.equal(res.statusCode, 201);
          assert.ok(body instanceof Array, true);
          assert.equal(body.length, mockData.parametersArray.length);
          assert.ok(body[0].name, mockData.parametersArray[0].name);
          assert.ok(body[0].units, mockData.parametersArray.units);
          createdParams = helper.saveGeneratedIds(body, "name");
          done(err);
        });
      });
      it("returns code 409 (duplicate name)", function (done) {
        request({
          url: "http://localhost:3030/api/v1/parameters",
          method: "POST",
          json: true,
          body: mockData.duplicateParameterObj
        }, function (err, res, body) {
          assert.equal(res.statusCode, 409);
          assert.equal(res.body.name, "Conflict");
          done(err);
        });
      });
    });
  });

  /**
  *       Rules
  */
  describe("Testing Rules.", function () {
    describe("Creating Rules.", function () {
      it("returns code 201 & the created rules array", function (done) {
        let rules = helper.generateRules(createdUsers, createdParams);
        request({
          url: "http://localhost:3030/api/v1/rules",
          method: "POST",
          json: true,
          body: rules
        }, function (err, res, body) {
          assert.equal(res.statusCode, 201);
          assert.ok(body instanceof Array, true);
          assert.equal(body.length, rules.length);
          done(err);
        });
      });
    });
  });

  /**
  *       Events
  */
  describe("Testing Events.", function () {
    describe("Creating Random Events.", function () {
      it("returns code 201 & the created events array", function (done) {
        let events = helper.generateEvents(createdParams, minValue, maxValue, eventsToBeCreatedPerParam);
        request({
          url: "http://localhost:3030/api/v1/events",
          method: "POST",
          json: true,
          body: events
        }, function (err, res, body) {
          assert.equal(res.statusCode, 201);
          assert.ok(body instanceof Array, true);
          assert.equal(body.length, events.length);
          done(err);
        });
      });
    });
  });

  /**
  *       Alerts
  */
  describe("Testing Alerts.", function () {
    describe("Determining if alerts were automatically created.", function () {
      it(`1/3 - GET all /events of a single parameter (first one in DB)`, function (done) {
        request({
          url: "http://localhost:3030/api/v1/events",
          method: "GET",
          json: true,
          qs: {paramId: createdParams[0]._id}
        }, function (err, res, body) {
          // console.log(`# of Events of paramId ${createdParams[0]._id}:`, body.length)
          paramEvents = body;
          assert.equal(res.statusCode, 200);
          // assert.equal(body.length, createdEvents.length);
          done(err);
        });
      });
      it("2/3 - GET threshold values for that parameter", function (done) {
        request({
          url: "http://localhost:3030/api/v1/rules",
          method: "GET",
          json: true,
          qs: {paramId: createdParams[0]._id}
        }, function (err, res, body) {
          assert.equal(res.statusCode, 200);
          assert.ok(body.length > 0, true);
          // storing all thresholds defined for this param
          body.forEach((rule) => {
            if (paramThresholds.indexOf(rule.threshold)) {
              paramThresholds.push(rule.threshold);
            }
          })
          paramRules = body.length;
          // console.log("PARAMRULES", paramRules)
          done(err);
        });
      });
      it("3/3 - GET /alerts for that parameter & check if API computed them correctly", function (done) {
        request({
          url: "http://localhost:3030/api/v1/alerts",
          qs: {paramId: createdParams[0]._id},
          method: "GET",
          json: true
        }, function (err, res, body) {
          assert.equal(res.statusCode, 200);
          assert.notEqual(typeof body[0].paramId, "Object"); // tests if populate() hooks are working. should only be object (populated) when called from GET /users/{id}/alerts
          assert.ok(body[0].event instanceof Object, true); // tests if populate() hooks are working
          assert.ok(body[0].rule instanceof Object, true); // tests if populate() hooks are working
          eventsHigherThanThreshold = helper.calculateAlertsForEvent(paramEvents, paramThresholds);
          // console.log("EVENTSHIGHERTHANTHRESHOLD", eventsHigherThanThreshold)
          assert.equal(body.length, paramRules * eventsHigherThanThreshold);
          // console.log("PARAMRULES * EVENTSHIGHERTHANTHRESHOLD", paramRules * eventsHigherThanThreshold)
          done(err);
        });
      });
    });
  });

  /**
  *       Linked routes
  */
  describe("Testing linked collections.", function () {
    describe("GET /users/{userId}/rules", function () {
      it("returns 200 with an array of this user's rules", function (done) {
        request({
          url: "http://localhost:3030/api/v1/users/" + createdUsers[0]._id + "/rules",
          method: "GET",
          json: true
        }, function (err, res, body) {
          assert.equal(res.statusCode, 200);
          assert.ok(body instanceof Array, true);
          done(err);
        });
      });
    });
    describe("POST /users/{userId}/rules", function () {
      it("Creates and links rule(s) with that user. Returns 200 with either 1 obj or array, depending on the POST'd data", function (done) {
        // will create add a single new rule
        // using mock data with a now known paramId
        mockData.ruleToBeAddedToUser.paramId = createdParams[0]._id;
        request({
          url: "http://localhost:3030/api/v1/users/" + createdUsers[0]._id + "/rules",
          method: "POST",
          body: mockData.ruleToBeAddedToUser,
          json: true
        }, function (err, res, body) {
          assert.equal(res.statusCode, 201);
          // response body is Array if we've POST'd an array of obj rules;
          // Object if only 1 rule has been POST'd
          assert.equal(typeof body, typeof mockData.ruleToBeAddedToUser);
          done(err);
        });
      });
    });
  });
});
