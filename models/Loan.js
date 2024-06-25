const mongoose = require("mongoose");

const LoanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  term: { type: Number, required: true },
  status: {
    type: String,
    enum: ["requested", "approved", "rejected"],
    default: "requested",
  },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Loan", LoanSchema);
