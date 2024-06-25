const express = require("express");
const { requestLoan, getLoans } = require("../controllers/loanController");
const { protect } = require("../Middlewares/authMiddleware");
const router = express.Router();

router.post("/", protect, requestLoan);
router.get("/", protect, getLoans);

module.exports = router;
