import { ValidationError } from "../utils/errors.utils.js";
import axios from "axios";

export async function CompleteProfileService(fullName, userId) {
  try {
    const firstName = fullName;
    if (!fullName || !userId) {
      throw new ValidationError(
        "fullName and userId are required to complete profile",
      );
    }

    const result = await axios.patch(
      `${process.env.API_GATEWAY_URL}/api/internal/${userId}/profile-complete`,
      {
        firstName,
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
