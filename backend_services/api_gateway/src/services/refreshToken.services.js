import { getUserById } from "../repositories/auth.repository.js";
import {
  deleteRefreshToken,
  saveRefreshToken,
} from "../repositories/refreshToken.repositories.js";
import { NotFoundError, ValidationError } from "../utils/errors.utils.js";
import { hashRefreshToken } from "../utils/jwt.utils.js";

export async function ExistingRefreshToken(userId, refreshToken) {
  try {
    if (!userId) {
      throw new ValidationError("User ID is required!");
    }

    const { data, error } = await getUserById(userId);

    if (error || !data) {
      throw new NotFoundError("User");
    }

    const { token, tokenError } = await deleteRefreshToken(data.id);
    if (tokenError) {
      throw new NotFoundError("Refresh Token");
    }

    const hashedToken = await hashRefreshToken(refreshToken);

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    const { savedToken, savedTokenError } = await saveRefreshToken(
      data.id,
      hashedToken,
      expiredAt,
    );

    console.log("ExistingRefreshToken result:", {
      savedToken,
      savedTokenError,
    });

    if (savedTokenError) {
      throw new NotFoundError("Failed to save Refresh Token");
    }

    return {
      success: true,
      message: "Refresh token updated successfully",
    };
  } catch (e) {
    console.error("Error in ExistingRefreshToken:", e);
    throw e;
  }
}
