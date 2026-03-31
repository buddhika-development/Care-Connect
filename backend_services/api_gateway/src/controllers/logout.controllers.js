import { ApiResponse } from "../utils/apiResponse.utils.js";
import { clearRefreshTokenCookie } from "../utils/cookie.utils.js";

export const logoutController = async (req, res, next) => {
  try {
    const result = clearRefreshTokenCookie(res);

    console.log("Logout result:", result);

    return ApiResponse.success(res, {
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Error in logoutController:", error);
    next(error);
  }
};
