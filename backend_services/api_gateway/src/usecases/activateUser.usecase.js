import {
  changeActivationStatus,
  changeVerificationStatus,
  getUserById,
} from "../repositories/auth.repository.js";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.utils.js";

export async function ActivateUserUsecase(userId, activeParam, verifyParam) {
  try {
    if (!userId) {
      throw new ValidationError("User ID is required");
    }

    const { data, error } = await getUserById(userId);

    if (error || !data) {
      throw new NotFoundError("User");
    }

    const isActiveParamProvided =
      activeParam !== undefined && activeParam !== null && activeParam !== "";
    const isVerifyParamProvided =
      verifyParam !== undefined && verifyParam !== null && verifyParam !== "";

    if (!isActiveParamProvided && !isVerifyParamProvided) {
      throw new ValidationError("Parameter is required");
    }

    if (isActiveParamProvided) {
      if (activeParam !== "true" && activeParam !== "false") {
        throw new ValidationError("Active parameter must be 'true' or 'false'");
      }

      const isActive = activeParam === "true";

      if (data.is_active === isActive) {
        return {
          success: true,
          message: `User is already ${isActive ? "active" : "inactive"}`,
          data: {
            id: data.id,
            is_active: isActive,
          },
        };
      }

      const { isActiveError } = await changeActivationStatus(userId, isActive);
      if (isActiveError) {
        throw new DatabaseError("Failed to update user activation status");
      }

      return {
        success: true,
        message: `User has been successfully ${isActive ? "activated" : "deactivated"}`,
        data: {
          id: userId,
          is_active: isActive,
        },
      };
    } else if (isVerifyParamProvided) {
      if (verifyParam !== "true" && verifyParam !== "false") {
        throw new ValidationError("Verify parameter must be 'true' or 'false'");
      }

      if (data.role !== "doctor") {
        throw new ValidationError("Only doctors can be verified");
      }

      const isVerified = verifyParam === "true";

      if (data.is_verified === isVerified) {
        return {
          success: true,
          message: `User is already ${isVerified ? "verified" : "unverified"}`,
          data: {
            id: data.id,
            is_verified: isVerified,
          },
        };
      }

      const { isVerifiedError } = await changeVerificationStatus(
        userId,
        isVerified,
      );
      if (isVerifiedError) {
        throw new DatabaseError("Failed to update user verification status");
      }

      return {
        success: true,
        message: `User has been successfully ${isVerified ? "verified" : "unverified"}`,
        data: {
          id: userId,
          is_verified: isVerified,
        },
      };
    }
  } catch (error) {
    console.error("Error activating user:", error);
    throw error;
  }
}
