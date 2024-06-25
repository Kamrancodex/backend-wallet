const twilio = require("twilio");
const Otp = require("./models/Otp");
const generateOtp = require("./generateOtp");
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Define SMS templates
const templates = {
  otp: (otp) => `Hello from payMe! Here is your OTP: ${otp}`,
  requestMoney: (requesterName, amount, payLink) =>
    `You have received a money request from ${requesterName} for ${amount}. Pay using this link: ${payLink}`,
  // Add more templates as needed
};

async function sendSMS({ number, templateName, variables }) {
  try {
    let messageBody;
    if (templateName === "otp") {
      const otp = generateOtp();
      await Otp.create({ otp, number }); // Save OTP to database
      messageBody = templates[templateName](otp);
    } else if (templateName === "requestMoney") {
      const { requesterName, amount, payLink } = variables;
      messageBody = templates[templateName](requesterName, amount, payLink);
    }

    const message = await client.messages.create({
      body: messageBody,
      to: `+${number}`, // Text your number
      from: process.env.TWILIO_PHONE_NUMBER || "+19403082862", // From a valid Twilio number
    });

    console.log("Message sent: %s", message.sid);
    return { success: true };
  } catch (error) {
    console.error("Error in sending SMS:", error);
    return { success: false, error: error.message };
  }
}

module.exports = sendSMS;
