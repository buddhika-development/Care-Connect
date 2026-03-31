import { loginUser } from "../usecases/login.usecases.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { setRefreshTokenCookie } from "../utils/cookie.utils.js";

export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for email:", email);

    const result = await loginUser(email, password);

    if (result.success) {
      const { accessToken, refreshToken, user } = result.data;
      setRefreshTokenCookie(res, refreshToken);
      return ApiResponse.success(res, {
        message: "Login successful",
        data: {
          accessToken,
          userId: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          complete_profile: user.complete_profile,
        },
      });
    }
  } catch (e) {
    console.error("Error in loginController:", e);
    next(e);
  }
};
