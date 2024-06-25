const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
require("dotenv").config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_MAIL, // your Gmail address
    pass: process.env.SMTP_PASSWORD, // your Gmail app password
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 5000, // 5 seconds
});

// Read and compile HTML templates from the letters folder
const loadTemplate = (templateName) => {
  const filePath = path.join(__dirname, "letters", `${templateName}.html`);
  const source = fs.readFileSync(filePath, "utf-8").toString();
  return handlebars.compile(source);
};

// Load all templates
const templates = {
  resetPassword: loadTemplate("resetPassword"),
  verifyEmail: loadTemplate("verifyEmail"),
  requestMoney: loadTemplate("requestMoney"),
  verifyLogin: loadTemplate("verifyLogin"),
  kycApproved: loadTemplate("kycApproved"),
};

// Function to send email
const sendEmail = async ({ email, subject, templateName, variables }) => {
  try {
    const htmlToSend = templates[templateName](variables); // Generate HTML for the email

    const mailOptions = {
      from: `"payMe" <${process.env.SMTP_MAIL}>`,
      to: email,
      subject: subject,
      html: htmlToSend,
    };

    const info = await transporter.sendMail(mailOptions); // Send email

    console.log("Message sent: %s", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Error in sending email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
