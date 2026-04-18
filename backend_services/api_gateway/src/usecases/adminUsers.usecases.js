import {
  changeActivationStatus,
  changeVerificationStatus,
  getUserById,
  getUsersForAdmin,
} from "../repositories/auth.repository.js";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.utils.js";

const ALLOWED_ROLES = ["patient", "doctor", "admin"];
const ALLOWED_STATUS = ["all", "active", "inactive"];

export async function GetAdminUsersUsecase(params = {}) {
  const search = typeof params.search === "string" ? params.search : "";
  const role = typeof params.role === "string" ? params.role.trim() : "";
  const status =
    typeof params.status === "string"
      ? params.status.trim().toLowerCase()
      : "all";

  if (role && !ALLOWED_ROLES.includes(role)) {
    throw new ValidationError("role must be one of patient, doctor, admin");
  }

  if (!ALLOWED_STATUS.includes(status)) {
    throw new ValidationError("status must be one of all, active, inactive");
  }

  const isActive = status === "all" ? undefined : status === "active";

  const { data, error } = await getUsersForAdmin({
    search,
    role: role || undefined,
    isActive,
  });

  if (error) {
    throw new DatabaseError("Failed to fetch users");
  }

  return (data || []).map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    isActive: !!user.is_active,
    isVerified: !!user.is_verified,
    completeProfile: !!user.complete_profile,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }));
}

export async function UpdateUserActiveStatusUsecase(
  targetUserId,
  isActive,
  actorUserId,
) {
  if (!targetUserId) {
    throw new ValidationError("User ID is required");
  }

  if (typeof isActive !== "boolean") {
    throw new ValidationError("isActive must be a boolean");
  }

  const { data: targetUser, error: targetError } =
    await getUserById(targetUserId);
  if (targetError || !targetUser) {
    throw new NotFoundError("User");
  }

  if (targetUser.id === actorUserId && isActive === false) {
    throw new ValidationError("You cannot deactivate your own account");
  }

  const { isActiveError } = await changeActivationStatus(
    targetUserId,
    isActive,
  );
  if (isActiveError) {
    throw new DatabaseError("Failed to update user activation status");
  }

  return {
    id: targetUserId,
    isActive,
  };
}

export async function UpdateDoctorVerificationStatusUsecase(
  targetUserId,
  isVerified,
) {
  if (!targetUserId) {
    throw new ValidationError("User ID is required");
  }

  if (typeof isVerified !== "boolean") {
    throw new ValidationError("isVerified must be a boolean");
  }

  const { data: targetUser, error: targetError } =
    await getUserById(targetUserId);
  if (targetError || !targetUser) {
    throw new NotFoundError("User");
  }

  if (targetUser.role !== "doctor") {
    throw new ValidationError("Only doctors can be verified or unverified");
  }

  const { isVerifiedError } = await changeVerificationStatus(
    targetUserId,
    isVerified,
  );
  if (isVerifiedError) {
    throw new DatabaseError("Failed to update doctor verification status");
  }

  return {
    id: targetUserId,
    isVerified,
  };
}
