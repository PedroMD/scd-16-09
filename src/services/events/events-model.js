"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ParametersModel = require("../parameters/parameters-model");

const eventsSchema = new Schema({
  value: { type: Number, required: true },
  paramId: { type: Schema.Types.ObjectId, ref: "ParametersModel" },
  timestamp: { type: Date, "default": Date.now }
});

const eventsModel = mongoose.model("events", eventsSchema);

module.exports = eventsModel;
