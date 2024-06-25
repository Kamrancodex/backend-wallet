const express = require("express");
const {
  createTransaction,
  getTransactions,
  getTransactionDetails,
} = require("../controllers/transactionController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, createTransaction);
router.get("/", protect, getTransactions);
router.get("/:id", protect, getTransactionDetails);

module.exports = router;
