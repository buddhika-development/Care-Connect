import { registerUsecase } from "../usecases/register.usecases.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";

export async function registerController(req, res, next) {
  try {
    const { email, firstName, lastName, role, password } = req.body;
    const result = await registerUsecase({
      email,
      firstName,
      lastName,
      role,
      password,
    });
    if (result.success) {
      return ApiResponse.success(res, {
        message: "User registered successfully",
        data: {
          email: result.data[0].email,
          firstName: result.data[0].first_name,
          lastName: result.data[0].last_name,
        },
      });
    }
  } catch (e) {
    console.error("Error in registerController:", e);
    next(e);
  }
}
