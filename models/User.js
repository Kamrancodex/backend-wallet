const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  balance: { type: Number, default: 0 },
  creditLimit: { type: Number, default: 0 },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
  rememberMeToken: { type: String },
  rememberMeTokenExpiry: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },
  address: { type: String }, // Added address field
  kycStatus: { type: String, default: "not_started" }, // Added kycStatus field
  profilePic: { type: String, default: "" },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
