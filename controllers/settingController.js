const User = require("../models/User");
const Otp = require("../models/Otp");
const sendEmail = require("../sendEmail");
const sendSMS = require("../sendSMS");
const otpGenerator = require("otp-generator");
function generateOtp() {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
}

exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    console.log("Generating OTP for email:", email);
    const otp = generateOtp();
    console.log("Generated OTP:", otp);
    await Otp.create({ otp, email });
    console.log("OTP saved to database");

    const subject = "Your OTP Code";
    const templateName = "verifyEmail";
    const variables = { otp };

    // Log the email being sent
    console.log("Sending OTP email to:", email);

    const emailResponse = await sendEmail({
      email, // Ensure the correct recipient email is passed here
      subject,
      templateName,
      variables,
    });

    if (!emailResponse.success) {
      console.error("Failed to send OTP email:", emailResponse);
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Error in sendOtp function:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.updateEmail = async (req, res) => {
  const { otp, newEmail } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const otpDoc = await Otp.findOne({ otp });

    if (!otpDoc || otpDoc.email !== user.email) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.email = newEmail;
    await user.save();

    res.status(200).json({ message: "Email updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.updatePhoneNumber = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res
      .status(404)
      .json({ message: "please enter a valid phone number" });
  }
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    await Otp.create({ otp, phoneNumber });
    user.phoneNumber = phoneNumber;
    user.phoneVerified = false;
    await user.save();

    await sendSMS(phoneNumber, `Your OTP code is ${otp}`);

    res.status(200).json({ message: "OTP sent to phone number" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.verifyPhoneNumber = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  try {
    const otpDoc = await Otp.findOne({ otp });
    if (!otpDoc) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.phoneVerified = true;
    await user.save();

    res.status(200).json({ message: "Phone number verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
exports.updateAddress = async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ message: "Address is required" });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.address = address;
    await user.save();

    res
      .status(200)
      .json({ message: "Address updated successfully", address: user.address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.verifyPassword = async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    res.status(200).json({ message: "Password verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.updateUserProfilePic = async (req, res) => {
  try {
    const userId = req.user.id;
    const profilePicPath = req.file.path;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profilePic = profilePicPath;
    await user.save();

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePic: profilePicPath,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Server error" });
  }
};
