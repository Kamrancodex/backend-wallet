const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://rohitvlogs02:RwH0X8bJF3IpfoxL@cluster0.lhw3atd.mongodb.net/test"
);
const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 30,
    lowercase: true,
  },
  lastName: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 30,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  verified: {
    type: Boolean,
  },
});
const User = mongoose.model("User", userSchema);
module.exports = User;
