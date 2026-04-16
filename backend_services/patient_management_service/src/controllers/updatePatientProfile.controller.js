import { UpdatePatientProfileUsecase } from "../usecases/updatePatientProfile.usecase.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";

export const UpdatePatientProfileController = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const headerEmail = req.user.email;

    console.log(
      "Updating patient profile for userId:",
      userId,
      "with email:",
      headerEmail,
    );

    const result = await UpdatePatientProfileUsecase(
      userId,
      headerEmail,
      req.body,
      req.files,
    );

    if (result.success) {
      return ApiResponse.created(res, {
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    console.error("Error in UpdatePatientProfileController:", error);
    next(error);
  }
};
