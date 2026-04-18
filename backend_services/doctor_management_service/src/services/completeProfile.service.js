import { ValidationError } from "../utils/errors.utils.js";
import axios from "axios";

export async function CompleteProfileService(firstName, lastName, userId) {
  try {
    if (!firstName || !userId) {
      throw new ValidationError(
        "firstName and userId are required to complete profile",
      );
    }

    const result = await axios.patch(
      `${process.env.API_GATEWAY_URL}/api/internal/${userId}/profile-complete`,
      {
        firstName,
        lastName: lastName || "",
        completeProfile: true,
      },
      {
        headers: {
          "x-internal-secret": process.env.INTERNAL_SECRET,
          "x-service-name": process.env.SERVICE_NAME,
        },
      },
    );

    console.log("CompleteProfileService result:", result.data);

    return result.data;
  } catch (error) {
    console.error("Error in CompleteProfileService:", error);
    throw error;
  }
}
