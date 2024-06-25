const express = require("express");
const {
  signup,
  signin,
  verifyEmail,
  resetPassword,
  sendResetLink,
  getUserDetails,
  getTransactions,
  resendOtp,
} = require("../controllers/userController");
const { protect } = require("../Middlewares/authMiddleware");
const router = express.Router();

router.get("/user-details", protect, getUserDetails);
router.get("/transactions", protect, getTransactions);
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/verify-email", verifyEmail);
router.post("/send-reset-link", sendResetLink);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOtp);

module.exports = router;
