const User = require("../models/User");
const Otp = require("../models/Otp");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../sendEmail");
const sendSMS = require("../sendSMS");
const generateOtp = require("../generateOtp");
const crypto = require("crypto");
const Transaction = require("../models/Transaction");
exports.hello = (req, res) => {
  res.send("hello");
};

exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user._id; // assuming user ID is available in req.user
    const user = await User.findById(userId).select(
      "firstName lastName email verified balance creditLimit profilePic"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate total balance and expecting amount
    const totalBalance = user.balance;
    const expectingAmount = await Transaction.aggregate([
      { $match: { userId: userId, status: "Pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const profilePicUrl = user.profilePic
      ? `http://localhost:8000/${user.profilePic}`
      : null;

    const response = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      verified: user.verified,
      profilePic: profilePicUrl,
      balance: {
        totalBalance: totalBalance,
        mortgage: user.creditLimit,
        expectingAmount: expectingAmount[0]?.total || 0,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching user details:", error); // Log the error
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const transactions = await Transaction.find({ userId })
      .populate("recipientId", "firstName lastName email")
      .sort({ date: -1 })
      .limit(10);
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.signup = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  const errors = {};

  if (!firstName) errors.firstName = "Please enter your First Name";
  if (!lastName) errors.lastName = "Please enter your Last Name";
  if (!email) errors.email = "Please enter your Email";
  if (!password) errors.password = "Please enter the Password";
  if (password !== confirmPassword)
    errors.confirmPassword = "Passwords do not match";

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.email = "Invalid email format";
  }

  // Password validation regex
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    errors.password =
      "Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character";
  }

  if (Object.keys(errors).length > 0) {
    return res
      .status(400)
      .json({ errors, message: "Please fill all the fields correctly" });
  }

  try {
    const emailExists = await User.findOne({ email });

    if (emailExists) {
      return res.status(400).json({
        errors: { email: "Email already exists" },
        message: "Email already exists",
      });
    }

    // Generate OTP
    const otp = generateOtp();
    await Otp.create({ otp, email });

    const subject = "Email Verification";
    const variables = { otp };
    const templateName = "verifyEmail";

    const emailResponse = await sendEmail({
      email,
      subject,
      templateName,
      variables,
    });

    if (!emailResponse.success) {
      return res.status(500).json({
        success: false,
        message: "Signup failed, failed to send OTP email.",
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    return res
      .status(201)
      .send({ msg: "User created successfully", token: token });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Unexpected error! Please try again");
  }
};

exports.verifyNum = async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).send("Please enter a valid number");

  try {
    await sendSMS(number);
    res.status(200).send("OTP sent successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred");
  }
};

exports.verifyEmail = async (req, res) => {
  const { otp: otpInput } = req.body;

  try {
    const foundOtp = await Otp.findOne({ otp: otpInput });
    if (!foundOtp) {
      return res.status(400).send("Invalid verification code");
    }

    const { email } = foundOtp;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.verified = true;
    await user.save();
    res.status(200).send("Email verified successfully");
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).send("Something unexpected happened");
  }
};

exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  console.log("Received resend OTP request with email:", email);

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const otp = generateOtp();
    await Otp.create({ otp, email });

    const subject = "Your new OTP Code";
    const templateName = "verifyEmail";
    const variables = { otp };

    const emailResponse = await sendEmail({
      email,
      subject,
      templateName,
      variables,
    });

    if (!emailResponse.success) {
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Error in resending OTP:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.signin = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Email doesn't exist" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Check if rememberMeToken is still valid
    if (user.rememberMeToken && user.rememberMeTokenExpiry > new Date()) {
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
      return res
        .status(200)
        .json({ message: "Signin successful", token, requiresOtp: false });
    }

    // If rememberMe is checked, create a new token and expiry date
    if (rememberMe) {
      const rememberMeToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
      user.rememberMeToken = rememberMeToken;
      user.rememberMeTokenExpiry = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ); // 30 days from now
      await user.save();
    }

    const otp = generateOtp();
    await Otp.create({ otp, email: user.email });

    const subject = "Email Verification";
    const variables = { otp };
    const templateName = "verifyEmail";

    await sendEmail({
      email: user.email,
      subject,
      templateName,
      variables,
    });

    res.status(200).json({ message: "OTP sent to email", requiresOtp: true });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Something unexpected happened" });
  }
};

exports.sendResetLink = async (req, res) => {
  const { input } = req.body;

  if (!input) {
    return res.status(400).send("Please enter your email or phone number");
  }

  try {
    const user = await User.findOne({
      $or: [{ email: input }, { phoneNumber: input }],
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const resetPasswordToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpiry = Date.now() + 3600000; // 1 hour from now
    await user.save();

    const resetLink = `http://localhost:5173/reset-password?token=${resetPasswordToken}`;
    const subject = "Password Reset";
    const variables = { resetLink };
    const templateName = "resetPassword";

    if (user.email) {
      await sendEmail({
        email: user.email,
        subject,
        templateName,
        variables,
      });
    } else if (user.phoneNumber) {
      await sendSMS(
        user.phoneNumber,
        `Your password reset link is ${resetLink}`
      );
    }

    res.status(200).send("Reset instructions sent successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred. Please try again");
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).send("All fields are required");
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (
      !user ||
      user.resetPasswordToken !== token ||
      user.resetPasswordExpiry < Date.now()
    ) {
      return res.status(400).send("Invalid or expired token");
    }

    user.password = newPassword; // The password will be hashed in the pre-save hook
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.status(200).send("Password reset successful");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred. Please try again");
  }
};
