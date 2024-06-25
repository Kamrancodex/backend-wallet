const express = require("express");
const router = express.Router();

const userRouter = require("./userRoutes");
const transactionRouter = require("./transactionRoutes");
const paymentRouter = require("./paymentRoutes");
const cardRouter = require("./cardRoutes");
const settingRouter = require("./settingRoutes");

router.use("/users", userRouter);
router.use("/transactions", transactionRouter);
router.use("/payments", paymentRouter);
router.use("/cards", cardRouter);
router.use("/settings", settingRouter);

module.exports = router;
