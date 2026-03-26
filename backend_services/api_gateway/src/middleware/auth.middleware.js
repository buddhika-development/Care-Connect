import { getUserById } from "../repositories/auth.repository.js";
import { ValidationError } from "../utils/errors.utils.js";
import { verifyAccessToken } from "../utils/jwt.utils.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // console.log("Authenticating request. Authorization header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const token = authHeader.substring(7);

    const decoded = verifyAccessToken(token);
    console.log("Decoded token in authentication middleware:", decoded);

    if (!decoded) {
      throw new ValidationError("Invalid or expired access token");
    }

    const { data, error } = await getUserById(decoded.userId);
    console.log("User lookup result in authentication middleware:", {
      data,
      error,
    });

    if (error) {
      throw new ValidationError("User not found");
    }
    if (!data || !data.is_active) {
      throw new ValidationError("User account is inactive or does not exist");
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    console.log(
      "Authorizing user. Required roles:",
      allowedRoles,
      "User role:",
      req.user?.role,
    );

    if (!req.user || !req.user.role) {
      throw new ValidationError("User role information is missing");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ValidationError("Access forbidden: insufficient permissions");
    }

    console.log("Authorization successful for user role:", req.user.role);

    next();
  };
};
