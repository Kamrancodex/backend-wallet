const express = require("express");
const User = require("../db/db");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../sendEmail");

router.get("/hello", (req, res) => {
  res.send("hello");
});

//signup route
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  try {
    const emailExists = await User.findOne({ email });

    if (emailExists) {
      return res.status(400).send("Email already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const subject = "Welcome! Here is your OTP Code";
    const message = "Thank you for signing up!";

    const emailResponse = await sendEmail({ email });
    console.log(emailResponse);
    if (!emailResponse.success) {
      return res.status(500).json({
        success: false,
        message: "Signup failed,failed to send OTP email.",
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      verified: false,
    });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    return res
      .status(201)
      .send({ msg: "User created successfully", token: token });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Unexpected error! Please try again");
  }
});

//login route

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("Email doesn't exist");
    }

    // Compare the provided password with the stored hash
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(400).send("Invalid password");
    }

    // Successful login
    res.status(200).send("Signin successful");
  } catch (error) {
    res.status(500).send("Something Unexpected Happened");
  }
});

module.exports = router;
