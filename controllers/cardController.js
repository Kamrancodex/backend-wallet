const User = require("../models/User");
const Card = require("../models/Card");
const Kyc = require("../models/Kyc");

const sendEmail = require("../sendEmail");

exports.applyForCreditCard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.phoneVerified) {
      return res.status(400).json({ message: "Phone number not verified" });
    }

    const card = new Card({
      user: req.user.id,
      type: "credit",
      cardNumber: generateCardNumber(), // Assume generateCardNumber is a function to generate card number
      cvv: generateCvv(), // Assume generateCvv is a function to generate CVV
      expirationDate: generateExpirationDate(), // Assume generateExpirationDate is a function to generate expiration date
      creditLimit: 5000, // Example credit limit
    });

    await card.save();

    res.status(201).json({ message: "Credit card applied successfully", card });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.addDebitCard = async (req, res) => {
  try {
    const { cardNumber, cvv, expirationDate } = req.body;

    if (!cardNumber || !cvv || !expirationDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const card = new Card({
      user: req.user.id,
      type: "debit",
      cardNumber,
      cvv,
      expirationDate,
      creditLimit: 0,
      balance: 0,
    });

    await card.save();

    res.status(201).json({ message: "Debit card added successfully", card });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.kycVerification = async (req, res) => {
  try {
    const { documentType, documentNumber, addressProof } = req.body;

    const kyc = new Kyc({
      user: req.user.id,
      documentType,
      documentNumber,
      addressProof,
      status: "pending",
    });

    await kyc.save();

    // Update user's KYC status to "in_process"
    const user = await User.findById(req.user.id);
    user.kycStatus = "in_process";
    await user.save();

    res
      .status(201)
      .json({ message: "KYC verification submitted successfully", kyc });

    // Approve KYC after 2 minutes
    setTimeout(async () => {
      kyc.status = "approved";
      await kyc.save();

      // Generate card details
      const card = new Card({
        user: req.user.id,
        type: "credit",
        cardNumber: generateCardNumber(),
        cvv: generateCvv(),
        expirationDate: generateExpirationDate(),
        creditLimit: 5000,
        balance: 0,
      });

      await card.save();

      // Update user's KYC status to "approved"
      user.kycStatus = "approved";
      await user.save();

      // Send approval email
      await sendEmail({
        email: user.email,
        subject: "KYC Approved",
        templateName: "kycApproved",
        variables: { userName: user.firstName, cardNumber: card.cardNumber },
      });
    }, 120000); // 2 minutes in milliseconds
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Helper functions to generate card details
function generateCardNumber() {
  return (
    "4000" +
    Math.floor(100000000000000 + Math.random() * 900000000000000).toString()
  );
}

function generateCvv() {
  return Math.floor(100 + Math.random() * 900).toString();
}

function generateExpirationDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 3);
  return date;
}

exports.getUserCards = async (req, res) => {
  try {
    const userId = req.user.id; // assuming user ID is available in req.user
    const cards = await Card.find({ user: userId });

    if (!cards || cards.length === 0) {
      return res.status(404).json({ message: "No cards found" });
    }

    res.status(200).json(cards);
  } catch (error) {
    console.error("Error fetching card details:", error);
    res.status(500).json({ message: "Server error" });
  }
};
