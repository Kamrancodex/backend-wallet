const Loan = require("../models/Loan");

exports.requestLoan = async (req, res) => {
  const { amount, interestRate, term } = req.body;
  try {
    const loan = new Loan({ user: req.user.id, amount, interestRate, term });
    await loan.save();
    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ message: "Error requesting loan", error });
  }
};

exports.getLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user.id });
    res.json(loans);
  } catch (error) {
    res.status(400).json({ message: "Error fetching loans", error });
  }
};
