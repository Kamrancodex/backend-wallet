const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Add recipientId
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    required: true,
  },
  date: { type: Date, default: Date.now },
  purpose: { type: String, required: true },
});

module.exports = mongoose.model("Transaction", TransactionSchema);
