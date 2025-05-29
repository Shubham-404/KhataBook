// models/user.js
const mongoose = require("mongoose");
const hisaabSchema = require("./hisaab"); // ✅ import schema, not model

const userSchema = mongoose.Schema({
    username: String,
    password: String,
    name: String,
    hisaabs: [hisaabSchema] // ✅ correct: use schema here
});

module.exports = mongoose.model("User", userSchema);
