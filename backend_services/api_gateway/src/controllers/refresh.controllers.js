import RefreshTokenUsecase from "../usecases/refresh.usecases.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";

export const RefreshTokenController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    const result = await RefreshTokenUsecase(refreshToken);

    if (result.success) {
      return ApiResponse.success(res, {
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    console.error("Error in RefreshTokenController:", error);
    next(error);
  }
};
