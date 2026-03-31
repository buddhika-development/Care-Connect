import { GetPatientProfileUsecase } from "../usecases/getPatientProfile.usecases.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";

export const GetPatientProfileController = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const headersUserId = req.user?.userId;
    const role = req.user?.role;

    const result = await GetPatientProfileUsecase(userId, headersUserId, role);

    if (result.success) {
      return ApiResponse.success(res, {
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    console.error("Error in GetPatientProfileController:", error);
    next(error);
  }
};
