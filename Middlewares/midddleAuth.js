const jwt = require("jsonwebtoken");
const User = require("../models/User");

const middleAuth = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  const rememberMeToken = req.cookies.rememberMeToken;

  if (!token && !rememberMeToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    let decoded;
    if (token) {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } else if (rememberMeToken) {
      decoded = jwt.verify(rememberMeToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (
        !user ||
        user.rememberMeToken !== rememberMeToken ||
        user.rememberMeTokenExpiry < new Date()
      ) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }

    req.user = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = middleAuth;
