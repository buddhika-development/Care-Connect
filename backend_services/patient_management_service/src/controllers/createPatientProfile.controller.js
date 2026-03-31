import { CreatePatientProfileUsecase } from "../usecases/createPatientProfile.usecases.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";

export const CreatePatientProfileController = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const headerEmail = req.user.email;

    console.log(
      "Creating patient profile for userId:",
      userId,
      "with email:",
      headerEmail,
    );

    const result = await CreatePatientProfileUsecase(
      userId,
      headerEmail,
      req.body,
      req.files,
    );

    console.log("CreatePatientProfileUsecase result:", result);
    console.log("Result success:", result.success);
    if (result.success) {
      return ApiResponse.success(res, {
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    console.error("Error in CreatePatientProfileController:", error);
    next(error);
  }
};
