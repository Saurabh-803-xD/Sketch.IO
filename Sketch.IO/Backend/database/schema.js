// require('dotenv').config();
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/sketch");

const userSchema = new mongoose.Schema({
    userName: String,
    userId: String,
    points: Number,
    room: String
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
