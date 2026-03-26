import { getUserByEmail } from "../repositories/auth.repository.js";
import { ExistingRefreshToken } from "../services/refreshToken.services.js";
import {
  AppError,
  InvalidEmailError,
  InvalidInputError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.utils.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.utils.js";
import { verifyPassword } from "../utils/pw.utils.js";

export async function loginUser(email, password) {
  try {
    if (!email || !password) {
      throw new ValidationError("Email and password are required!");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new InvalidEmailError("Email or Password is incorrect!");
    }

    const { data, error } = await getUserByEmail(email.toLowerCase());

    if (error || !data) {
      throw new NotFoundError("User");
    }

    if (data.is_active === false || data.is_verified === false) {
      throw new InvalidInputError("Account is not active or verified!");
    }

    const isPasswordValid = await verifyPassword(password, data.password_hash);

    if (!isPasswordValid) {
      throw new InvalidInputError("Email or Password is incorrect!");
    }

    const payload = { userId: data.id, email: data.email, role: data.role };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    if (!accessToken || !refreshToken) {
      throw new AppError("Failed to generate authentication tokens", 500);
    }

    const result = await ExistingRefreshToken(data.id, refreshToken);

    if (!result.success) {
      throw new AppError("Failed to login! Try again later.", 500);
    }

    return {
      success: true,
      status: 200,
      data: {
        accessToken,
        refreshToken,
        user: data,
      },
    };
  } catch (e) {
    throw e;
  }
}
