"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const UsersModel = require("../user/user-model");
const ParametersModel = require("../parameters/parameters-model");

const rulesSchema = new Schema({
  paramId: { type: Schema.Types.ObjectId, ref: "ParametersModel", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "UsersModel", required: true },
  threshold: { type: Number, required: true },
  createdAt: { type: Date, "default": Date.now }
});

const rulesModel = mongoose.model("rules", rulesSchema);

module.exports = rulesModel;
