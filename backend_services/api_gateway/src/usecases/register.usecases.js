import { saveUser } from "../repositories/auth.repository.js";
import { ForbiddenError, ValidationError } from "../utils/errors.utils.js";
import { hashPassword } from "../utils/pw.utils.js";
import { sendDoctorCredentialsEmail } from "../services/notification.services.js";

export async function registerUsecase(userData) {
  try {
    const { email, password, firstName, lastName, role, actorRole } = userData;

    console.log("Registering user with email:", email);

    if (!email || !password || !firstName || !lastName || !role) {
      throw new ValidationError("All fields are required!");
    }

    if (!["patient", "doctor"].includes(role)) {
      throw new ValidationError("role must be either patient or doctor");
    }

    if (role === "doctor" && actorRole !== "admin") {
      throw new ForbiddenError("Only admins can create doctor accounts");
    }

    if (role === "patient" && actorRole === "admin") {
      throw new ValidationError("Admins can only create doctor accounts");
    }

    const hashedPassword = await hashPassword(password);

    const isVerified = true;
    const completeProfile = false;

    const { data, error } = await saveUser(
      email.toLowerCase(),
      hashedPassword,
      role,
      firstName,
      lastName,
      true, // isActive
      isVerified,
      completeProfile,
    );

    console.log("User registration result:", { data, error });

    if (error || !data) {
      throw new ValidationError("Failed to register user! Try again later.");
    }

    let credentialsEmailSent = null;

    if (role === "doctor") {
      try {
        await sendDoctorCredentialsEmail({
          email: email.toLowerCase(),
          firstName,
          lastName,
          password,
        });
        credentialsEmailSent = true;
      } catch (notificationError) {
        console.error(
          "Failed to send doctor credentials email:",
          notificationError,
        );
        credentialsEmailSent = false;
      }
    }

    return {
      success: true,
      message: "User registered successfully",
      data,
      credentialsEmailSent,
    };
  } catch (e) {
    console.error("Error in registerUsecase:", e);
    throw e;
  }
}
