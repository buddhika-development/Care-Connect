import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const generateAccessToken = (payload) => {
  const { userId, email, role } = payload;
  const secretKey = process.env.JWT_ACCESS_SECRET;
  const expiration = process.env.JWT_ACCESS_EXPIRATION || "15";

  return jwt.sign({ userId, email, role }, secretKey, {
    expiresIn: expiration,
  });
};

export const generateRefreshToken = (payload) => {
  const { userId, role } = payload;
  const secretKey = process.env.JWT_REFRESH_SECRET;
  const expiration = process.env.JWT_REFRESH_EXPIRATION || "7d";

  return jwt.sign({ userId, role }, secretKey, {
    expiresIn: expiration,
  });
};

export const verifyAccessToken = (token) => {
  try {
    const secretKey = process.env.JWT_ACCESS_SECRET;
    return jwt.verify(token, secretKey);
  } catch (e) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const secretKey = process.env.JWT_REFRESH_SECRET;
    return jwt.verify(token, secretKey);
  } catch (e) {
    return null;
  }
};

export const hashRefreshToken = (token) => {
  const saltRound = Number(process.env.SALT_ROUNDS || 12);
  return bcrypt.hash(token, saltRound);
};
