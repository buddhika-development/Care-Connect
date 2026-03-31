import { getUserById } from "../repositories/auth.repository.js";
import { findRefreshToken } from "../repositories/refreshToken.repositories.js";
import { InvalidTokenError } from "../utils/errors.utils.js";
import {
  generateAccessToken,
  verifyRefreshToken,
  verifyRefreshTokenHash,
} from "../utils/jwt.utils.js";

export default async function RefreshTokenUsecase(refreshToken) {
  try {
    if (!refreshToken) {
      throw new InvalidTokenError("Refresh token is required");
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded || !decoded.userId) {
      throw new InvalidTokenError("Invalid refresh token");
    }

    const { token, tokenError } = await findRefreshToken(decoded.userId);

    if (tokenError || !token) {
      throw new InvalidTokenError("Refresh token not found");
    }

    const isValid = await verifyRefreshTokenHash(
      refreshToken,
      token.token_hash,
    );

    if (!isValid) {
      throw new InvalidTokenError("Invalid refresh token");
    }

    const accessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    if (!accessToken) {
      throw new InvalidTokenError("Failed to verify user session");
    }

    const { data, error } = await getUserById(decoded.userId);

    if (error || !data) {
      throw new InvalidTokenError("User not found");
    }

    return {
      success: true,
      message: "Session restored successfully!",
      data: {
        userId: decoded.userId,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: decoded.role,
        accessToken,
      },
    };
  } catch (error) {
    throw error;
  }
}
