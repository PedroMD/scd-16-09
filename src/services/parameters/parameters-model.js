"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const parametersSchema = new Schema({
  name: { type: String, required: true, index: true, unique: true },
  units: { type: String, required: true }, // SI-based string
  timestamp: { type: Date, "default": Date.now }
});

const parametersModel = mongoose.model("parameters", parametersSchema);

module.exports = parametersModel;
