import {
  getUserById,
  updateUserPasswordHash,
} from "../repositories/auth.repository.js";
import { hashPassword, verifyPassword } from "../utils/pw.utils.js";
import {
  AppError,
  InvalidInputError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.utils.js";

function validatePasswordStrength(password) {
  if (!password || typeof password !== "string") {
    throw new ValidationError("New password is required");
  }

  if (password.length < 8) {
    throw new ValidationError(
      "New password must be at least 8 characters long",
    );
  }

  if (!/[A-Z]/.test(password)) {
    throw new ValidationError(
      "New password must include at least one uppercase letter",
    );
  }

  if (!/[a-z]/.test(password)) {
    throw new ValidationError(
      "New password must include at least one lowercase letter",
    );
  }

  if (!/\d/.test(password)) {
    throw new ValidationError("New password must include at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>\-_=+\/\\[\]`~;]/.test(password)) {
    throw new ValidationError(
      "New password must include at least one special character",
    );
  }
}

export async function changePasswordUsecase({
  userId,
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  if (!userId) {
    throw new NotFoundError("User");
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ValidationError(
      "Current password, new password and confirm password are required",
    );
  }

  if (newPassword !== confirmPassword) {
    throw new InvalidInputError(
      "New password and confirm password do not match",
    );
  }

  validatePasswordStrength(newPassword);

  const { data: user, error } = await getUserById(userId);
  if (error || !user) {
    throw new NotFoundError("User");
  }

  const isCurrentPasswordValid = await verifyPassword(
    currentPassword,
    user.password_hash,
  );
  if (!isCurrentPasswordValid) {
    throw new InvalidInputError("Current password is incorrect");
  }

  const isSameAsOld = await verifyPassword(newPassword, user.password_hash);
  if (isSameAsOld) {
    throw new InvalidInputError(
      "New password must be different from current password",
    );
  }

  const hashedPassword = await hashPassword(newPassword);
  const { data: updatedUser, error: updateError } =
    await updateUserPasswordHash(userId, hashedPassword);

  if (updateError || !updatedUser) {
    throw new AppError("Failed to update password", 500);
  }

  return {
    success: true,
    message: "Password updated successfully",
    data: {
      userId: updatedUser.id,
      updatedAt: updatedUser.updated_at,
    },
  };
}
