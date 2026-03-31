import { CompleteProfileUsecase } from "../usecases/completeProfile.usecases.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";

export const CompleteProfileController = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { firstName, lastName, complereProfile } = req.body;

    const userData = {
      userId,
      firstName,
      lastName,
      complereProfile: true,
    };

    const result = await CompleteProfileUsecase(userData);

    console.log("CompleteProfileUsecase result:", result);
    if (result.success) {
      return ApiResponse.success(res, {
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    console.error("Error in CompleteProfileController:", error);
    next(error);
  }
};
