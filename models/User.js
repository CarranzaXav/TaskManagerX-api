const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    caseSensitive: false,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  roles: {
      type: [String],
      default: ["Common"],
  },
  email: {
      type: String,
      required:true,
      unique: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("User", userSchema);
