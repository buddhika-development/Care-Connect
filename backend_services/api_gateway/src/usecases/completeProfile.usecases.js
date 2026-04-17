import {
  getUserById,
  updateUserProfile,
} from "../repositories/auth.repository.js";
import {
  DatabaseError,
  MissingFieldError,
  NotFoundError,
} from "../utils/errors.utils.js";

export async function CompleteProfileUsecase(userData) {
  try {
    if (!userData) {
      throw new MissingFieldError("Profile data");
    }

    const { userId, firstName, lastName, completeProfile } = userData;
    console.log("CompleteProfileUsecase called with userData:", userData);

    if (!userId) {
      throw new NotFoundError("User");
    }

    const { data, error } = await getUserById(userId);

    if (!data || error) {
      throw new NotFoundError("User");
    }

    if (!userData.lastName || userData.lastName.trim() === null) {
      const profileData = {
        first_name: firstName,
        last_name: "",
        complete_profile: true,
      };
      console.log("Updating user profile with data:", profileData);
      const { data: updatedData, error: updateError } = await updateUserProfile(
        userId,
        profileData,
      );

      if (updateError || !updatedData) {
        throw new DatabaseError("Failed to update user profile");
      }

      return {
        success: true,
        message: "Profile completed successfully!",
        data: {
          userId: data.id,
        },
      };
    } else {
      const profileData = {
        first_name: firstName,
        last_name: lastName,
        complete_profile: true,
      };
      console.log("Updating user profile with data:", profileData);
      const { data: updatedData, error: updateError } = await updateUserProfile(
        userId,
        profileData,
      );

      if (updateError || !updatedData) {
        throw new DatabaseError("Failed to update user profile");
      }

      return {
        success: true,
        message: "Profile completed successfully!",
        data: {
          userId: data.id,
        },
      };
    }
  } catch (e) {
    console.error("Error in CompleteProfileUsecase:", e);
    throw e;
  }
}
