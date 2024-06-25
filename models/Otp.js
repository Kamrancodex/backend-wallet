const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  otp: { type: String, required: true },
  email: { type: String },
  phoneNumber: { type: String },
  createdAt: { type: Date, default: Date.now, index: { expires: "5m" } },
});

module.exports = mongoose.model("Otp", OtpSchema);
