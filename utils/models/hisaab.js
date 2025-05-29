// models/hisaab.js
const mongoose = require("mongoose");

const hisaabSchema = mongoose.Schema({
  amount: { type: String, required: true },
  description: { type: String, required: true },
  encrypt: { type: Boolean, default: false },
  passcode: { type: String, default: "none" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Export only the schema
module.exports = hisaabSchema;
