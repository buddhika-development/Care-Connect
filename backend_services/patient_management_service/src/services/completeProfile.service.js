import { MissingFieldError } from "../utils/errors.utils.js";
import axios from "axios";

export async function CompleteProfileService(firstName, lastName, userId) {
  try {
    if (!firstName || !lastName) {
      throw new MissingFieldError("First name and last name are");
    }

    const result = await axios.patch(
      `${process.env.API_GATEWAY_URL}/api/internal/${userId}/profile-complete`,
      {
        firstName,
        lastName,
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
