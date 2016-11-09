"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const RulesModel = require("../rules/rules-model");

const userSchema = new Schema({
  email: {type: String, required: true, unique: true, index: true},
  password: {type: String},
  rulesIds: [{ type: Schema.Types.ObjectId, ref: "RulesModel", required: true }],
  createdAt: { type: Date, "default": Date.now }
});

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
