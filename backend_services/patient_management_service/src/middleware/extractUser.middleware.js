const extractUser = (req, res, next) => {
  const gatewaySecret = req.headers["x-gateway-secret"];
  console.log("Extracting user from request headers:", {
    gatewaySecret,
    userId: req.headers["x-user-id"],
    email: req.headers["x-user-email"],
    role: req.headers["x-user-role"],
  });

  if (!gatewaySecret || gatewaySecret !== process.env.GATEWAY_SECRET) {
    return res.status(403).json({
      success: false,
      message:
        "Direct access not allowed. Request must come through API Gateway.",
    });
  }

  const userId = req.headers["x-user-id"];
  const email = req.headers["x-user-email"];
  const role = req.headers["x-user-role"];
  if (!userId || !role || !email) {
    return res.status(401).json({
      success: false,
      message: "Missing user identity headers from gateway.",
    });
  }

  req.user = {
    userId,
    email,
    role,
  };

  next();
};

export default extractUser;
