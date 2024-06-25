const mongoose = require("mongoose");

const KycSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  documentType: { type: String, required: true },
  documentNumber: { type: String, required: true },
  addressProof: { type: String, required: true },
  status: { type: String, required: true, default: "pending" },
});

module.exports = mongoose.model("Kyc", KycSchema);
