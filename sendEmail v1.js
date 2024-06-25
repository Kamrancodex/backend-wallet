const nodemailer = require("nodemailer");
const expressAsyncHandler = require("express-async-handler");
const generateOtp = require("./generateOtp");
require("dotenv").config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Function to send email
const sendEmail = async ({ email, subject, message }) => {
  const otp = generateOtp(); // Generate OTP

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email || "kamnoob@yahoo.com",
    subject: subject || "Your OTP Code",
    text: message || `Your OTP code is ${otp}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return { success: true, message: "Email sent successfully", info };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: "Failed to send email", error };
  }
};

module.exports = sendEmail;
