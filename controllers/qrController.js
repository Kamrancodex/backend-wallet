const QRCode = require("qrcode");

exports.generateQRCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const qrData = {
      userId: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
    res.status(200).json({ qrCode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
