const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://rohitvlogs02:RwH0X8bJF3IpfoxL@cluster0.lhw3atd.mongodb.net/test"
);
const otpSchema = mongoose.Schema({
  otp: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    require: true,
  },
  number: {
    type: String,
    require: true,
  },
  createdAt: {
    type: String,
  },
});
otpSchema.set("timestamps", true);
const OtpV1 = mongoose.model("OtpV1", otpSchema);
module.exports = OtpV1;
