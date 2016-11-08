"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const UsersModel = require("../user/user-model");
const EventsModel = require("../events/events-model");
const RulesModel = require("../rules/rules-model");
const ParamsModel = require("../parameters/parameters-model");

const alertsSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: "ParametersModel", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "UsersModel", required: true, index: true },
  ruleId: { type: Schema.Types.ObjectId, ref: "RulesModel", required: true },
  paramId: { type: Schema.Types.ObjectId, ref: "ParamsModel", required: true },
  timestamp: { type: Date, "default": Date.now },
});

const alertsModel = mongoose.model("alerts", alertsSchema);

module.exports = alertsModel;
