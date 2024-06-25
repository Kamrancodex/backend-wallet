const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.createTransaction = async (req, res) => {
  const { type, amount } = req.body;
  try {
    const transaction = new Transaction({ user: req.user.id, type, amount });
    await transaction.save();

    const user = await User.findById(req.user.id);
    if (type === "deposit") {
      user.balance += amount;
    } else if (type === "withdrawal" && user.balance >= amount) {
      user.balance -= amount;
    } else {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    user.transactions.push(transaction);
    await user.save();

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: "Error creating transaction", error });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });
    res.json(transactions);
  } catch (error) {
    res.status(400).json({ message: "Error fetching transactions", error });
  }
};

exports.getTransactionDetails = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(transaction);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error fetching transaction details", error });
  }
};
