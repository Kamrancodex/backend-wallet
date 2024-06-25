const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["debit", "credit"], required: true },
  cardNumber: { type: String, required: true, unique: true },
  cvv: { type: String, required: true },
  expirationDate: { type: Date, required: true },
  creditLimit: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
});

module.exports = mongoose.model("Card", CardSchema);
