const express = require("express");
const app = express();
const mainRouter = require("./routes/index");
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

mongoose
  .connect(
    "mongodb+srv://rohitvlogs02:RwH0X8bJF3IpfoxL@cluster0.lhw3atd.mongodb.net/walletApp",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB", err);
  });

// Configure CORS
const corsOptions = {
  origin: "https://wallet-frontend-sigma-nine.vercel.app/", // Replace with your frontend URL
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.get("/", function (req, res) {
  res.send("Hello World");
});
app.use("/api/v1", mainRouter);
app.listen(process.env.PORT);