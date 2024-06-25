const express = require("express");
const {
  applyForCreditCard,
  addDebitCard,
  kycVerification,
  getUserCards,
} = require("../controllers/cardController");
const { protect } = require("../Middlewares/authMiddleware");

const router = express.Router();

router.post("/apply-credit-card", protect, applyForCreditCard);
router.post("/add-debit-card", protect, addDebitCard);
router.post("/kyc-verification", protect, kycVerification);
router.get("/cards-details", protect, getUserCards);

module.exports = router;
