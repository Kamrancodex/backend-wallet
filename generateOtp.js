const otpGenerator = require("otp-generator");

function generateOtp() {
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
}
module.exports = generateOtp;
