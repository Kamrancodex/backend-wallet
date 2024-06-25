const User = require("../models/User");
const Transaction = require("../models/Transaction");
const sendEmail = require("../sendEmail");
const sendSMS = require("../sendSMS");
const jwt = require("jsonwebtoken");
const axios = require("axios");

exports.sendMoney = async (req, res) => {
  const { recipientIdentifier, amount, method, currency } = req.body;

  try {
    const sender = await User.findById(req.user.id);
    let recipient;

    if (method === "phone") {
      recipient = await User.findOne({ phoneNumber: recipientIdentifier });
    } else if (method === "email") {
      recipient = await User.findOne({ email: recipientIdentifier });
    } else if (method === "qr") {
      const qrData = JSON.parse(recipientIdentifier);
      recipient = await User.findById(qrData.userId);
    }

    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Convert amount to number
    const amountNumber = Number(amount);

    // Get currency conversion rate
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${currency}`
    );
    const conversionRate = response.data.rates.USD;
    const amountInUSD = amountNumber * conversionRate;

    if (sender.balance < amountInUSD) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    sender.balance -= amountInUSD;
    recipient.balance += amountInUSD;

    await sender.save();
    await recipient.save();

    const transaction = new Transaction({
      userId: req.user.id,
      recipientId: recipient._id,
      amount: amountInUSD,
      status: "Completed",
      purpose: `Transfer to ${recipient.email || recipient.phoneNumber}`,
    });
    await transaction.save();

    res.status(200).json({ message: "Money sent successfully", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.requestMoney = async (req, res) => {
  const { recipient, amount, currency, method } = req.body; // updated to match frontend
  const identifier = recipient; // use recipient as identifier

  try {
    const requester = await User.findById(req.user.id);
    let recipientUser;

    if (method === "phone") {
      recipientUser = await User.findOne({ phoneNumber: identifier });
    } else if (method === "email") {
      recipientUser = await User.findOne({ email: identifier });
    }

    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const token = jwt.sign(
      { requesterId: requester._id, amount },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const payLink = `http://localhost:5173/pay-request?token=${token}`;

    const emailSubject = "Money Request";
    const emailVariables = {
      recipientName: recipientUser.firstName,
      requesterName: requester.firstName,
      amount,
      payLink,
    };
    await sendEmail({
      email: recipientUser.email,
      subject: emailSubject,
      templateName: "requestMoney",
      variables: emailVariables,
    });

    // Send SMS
    const smsVariables = {
      requesterName: requester.firstName,
      amount,
      payLink,
    };
    await sendSMS({
      number: recipientUser.phoneNumber,
      templateName: "requestMoney",
      variables: smsVariables,
    });

    res.status(200).json({ message: "Request sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.payRequest = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { requesterId, amount } = decoded;

    const sender = await User.findById(req.user._id); // Ensure req.user is properly set by the protect middleware
    const recipient = await User.findById(requesterId);

    if (!recipient) {
      return res.status(404).json({ message: "Requester not found" });
    }

    const amountNumber = Number(amount);
    if (sender.balance < amountNumber) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    sender.balance -= amountNumber;
    recipient.balance += amountNumber;

    await sender.save();
    await recipient.save();

    const transaction = new Transaction({
      userId: req.user._id,
      recipientId: requesterId,
      amount: amountNumber,
      status: "Completed",
      purpose: `Payment to ${requesterId}`,
    });
    await transaction.save();

    res.status(200).json({ message: "Payment successful", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.getRequestDetails = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { requesterId, amount } = decoded;

    const requester = await User.findById(requesterId);

    if (!requester) {
      return res.status(404).json({ message: "Requester not found" });
    }

    res.status(200).json({
      requesterName: `${requester.firstName} ${requester.lastName}`,
      requesterEmail: requester.email,
      amount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.requestLoan = async (req, res) => {
  const { amount, interestRate, term } = req.body;

  try {
    const loanRequest = new Loan({
      user: req.user.id,
      amount,
      interestRate,
      term,
      status: "requested",
    });

    await loanRequest.save();
    res
      .status(201)
      .json({ message: "Loan requested successfully", loanRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
