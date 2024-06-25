const express = require("express");
const {
  sendMoney,
  requestMoney,
  requestLoan,
  payRequest,
  getRequestDetails,
} = require("../controllers/paymentController");
const { generateQRCode } = require("../controllers/qrController");
const { protect } = require("../Middlewares/authMiddleware");

const router = express.Router();

router.post("/send-money", protect, sendMoney);
router.post("/request-money", protect, requestMoney);

router.post("/request-loan", protect, requestLoan);
router.get("/generate-qr", protect, generateQRCode);
router
  .route("/pay-request")
  .get(payRequest) // Bypass protect middleware for GET request
  .post(protect, payRequest); // Protect middleware for POST request
router.get("/request-details", getRequestDetails);
module.exports = router;
