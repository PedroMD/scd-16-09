"use strict";

const mockData = require("./mockData");

var exports = module.exports = {};

/**
* Used to bind the data from mockData.js file and its generated _ids, once created in DB.
* Given an array of objs containing two properties, returns one of that props value ("_id") given the other property's value.
* @param  {array} data         data to be checked
* @param  {string} checkKey    obj's property name containing the value
* @param  {string} checkValue  value indicating which obj of @param data contains the wanted id
* @return {string}             the found _id
*/
exports.getCreatedId = function (data, checkKey, checkValue) {
  let id = "";
  data.forEach((obj, i) => {
    if (obj[checkKey] === checkValue) {
      id = obj._id;
    }
  })
  return id;
}

/**
* Used to correlate the generated "_id" with that mock data found in mockData.js.
* Used so we can then properly save rules for specific users address by e-mail, for example.
* @param  {array} createdData     the data created in DB
* @param  {string} refKeyName     the prop name used as unique reference in mockData.js
* @return {array}            an array containing objs each with the DB-unique prop ("_id") and the one used in mockData.js (@refKeyName)
*/
exports.saveGeneratedIds = function (createdData, refKeyName) {
  // console.log("REFKEYNAME", refKeyName)
  let savedIds = [];
  createdData.forEach((param, index) => {
    savedIds.push({
      [refKeyName]: param[refKeyName],
      "_id": param._id
    })
  })
  // console.log("savedIds", savedIds)
  return savedIds;
}

/**
* Generates a set of rules ready to be POST'd.
* Takes the previously created data (users & paramaters with their _ids) to generate a set of properly formated rules.
* @param  {array} createdUsers  the created users array
* @param  {array} createdParams the created parameters array
* @return {array}               an array of rules ready to be POST'd
*/
exports.generateRules = function (createdUsers, createdParams) {
  let rules = [];
  let userId = "";
  let paramId = "";
  mockData.rulesArrayAux.forEach((rule, index) => {
    rule.emails.forEach((email, index) => {
      userId = this.getCreatedId(createdUsers, "email", email)
      paramId = this.getCreatedId(createdParams, "name", rule.name)
      rules.push({
        "threshold": rule.threshold,
        "paramId": paramId,
        "userId": userId
      })
    })
  })
  // console.log("RULES", rules)
  return rules;
}

/**
* Simple func to pseudo-randomly generate events within a range of values
* Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
* @param  {string} paramId the paramId correspondent to this event
* @param  {integer} min     range's minimum possible value (included)
* @param  {integer} max     range's maximum possible value (excluded)
* @return {object}          event obj with the generated value
*/
const generateRandomEvent = function (paramId, min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  let event = {
    value: Math.floor(Math.random() * (max - min + 1)) + min,
    paramId: paramId
  };
  return event;
}

/**
* [generateEvents description]
* @param  {array} createdParams  array with all created params
* @param  {integer} min            range's minimum possible value (included)
* @param  {integer} max            range's maximum possible value (excluded)
* @param  {integer} eventsPerParam the amount of fake events that must be generated for every parameter
* @return {array}                array with all generated events ready to be POST'd
*/
exports.generateEvents = function (createdParams, min, max, eventsPerParam) {
  let events = [];
  createdParams.forEach((param, index) => {
    for (let i = 0; i < eventsPerParam; i++) {
      events.push(generateRandomEvent(param._id, min, max))
    }
  })
  // console.log("EVENTS", events)
  return events;
}

/**
 * Given an array @paramEvents containing all events of one single param, calculates all
 * of those whose "value" > @threshold
 * @param  {array} paramEvents all stored events of a single param
 * @param  {array} paramThresholds   threshold values for the single param (taken from rules)
 * @return {integer} result     the expected amount of events which should have triggered an alert
 */
exports.calculateAlertsForEvent = function (paramEvents, paramThresholds) {
  let result = 0;
  paramEvents.forEach((event, eventIndex) => {
    paramThresholds.forEach((threshold, thresholdIndex) => {
      if (event.value > threshold) {
        result++;
      }
    })
  })
  return result;
}
