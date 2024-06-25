const express = require("express");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const app = express();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "najarkamran1@gmail.com", // your Gmail address
    pass: "bdaamccprhdkbkud", // your Gmail app password
  },
});

// Read and compile the HTML template
const htmlTemplate = fs.readFileSync(
  path.join(__dirname, "letter.html"),
  "utf-8"
);
const template = handlebars.compile(htmlTemplate);

// Function to generate OTP
function generateOtp() {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
}

// Endpoint to send OTP email
app.get("/send-otp", async (req, res) => {
  const otp = generateOtp(); // Generate OTP
  const htmlToSend = template({ otp }); // Generate the final HTML content

  // Setup email data with unicode symbols
  const mailOptions = {
    from: '"pay.Me" <najarkamran1@gmail.com>', // sender address
    to: "kampremiumyt@gmail.com", // list of receivers
    subject: "Your verification OTP is", // Subject line
    text: `${otp} please use within 30 minutes`, // plain text body
    html: htmlToSend, // html body
  };

  // Send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(`Error: ${error}`);
      return res.status(500).send("Failed to send email");
    }
    console.log("Message sent: %s", info.messageId);
    res.send("OTP sent successfully");
  });
});

app.listen(2222, () => {
  console.log("Server is running on port 3000");
});
