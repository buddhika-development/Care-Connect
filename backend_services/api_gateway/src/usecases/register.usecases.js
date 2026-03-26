import { saveUser } from "../repositories/auth.repository.js";
import { ValidationError } from "../utils/errors.utils.js";
import { hashPassword } from "../utils/pw.utils.js";

export async function registerUsecase(userData) {
  try {
    const { email, password, firstName, lastName, role } = userData;

    console.log("Registering user with email:", email);

    if (!email || !password || !firstName || !lastName || !role) {
      throw new ValidationError("All fields are required!");
    }

    const hashedPassword = await hashPassword(password);

    const { data, error } = await saveUser(
      email.toLowerCase(),
      hashedPassword,
      role,
      firstName,
      lastName,
      true, // isActive
      true, // isVerified
    );

    console.log("User registration result:", { data, error });

    if (error || !data) {
      throw new ValidationError("Failed to register user! Try again later.");
    }
    return {
      success: true,
      message: "User registered successfully",
      data,
    };
  } catch (e) {
    console.error("Error in registerUsecase:", e);
    throw e;
  }
}
