const express = require("express");
const {
  updateEmail,
  verifyPhoneNumber,
  sendOtp,
  updatePhoneNumber,
  updateAddress,
  updatePassword,
  updateUserProfilePic,
} = require("../controllers/settingController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../Middlewares/multerConfig");

const router = express.Router();
router.post("/sendOtp", protect, sendOtp);
router.post("/update-email", protect, updateEmail);
router.post("/verify-phone", protect, verifyPhoneNumber);
router.post("/update-phone", protect, updatePhoneNumber);
router.post("/update-address", protect, updateAddress);
router.post("/update-password", protect, updatePassword);
router.post(
  "/profilePic",
  protect,
  upload.single("profilePic"),
  updateUserProfilePic
);

module.exports = router;
