import { ActivateUserUsecase } from "../usecases/activateUser.usecase.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";

export const ActivateUserController = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const activeParam = req.query.active;
    const verifyParam = req.query.verify;

    const result = await ActivateUserUsecase(userId, activeParam, verifyParam);

    if (result.success) {
      return ApiResponse.created(res, {
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    console.error("Error in ActivateUserController:", error);
    next(error);
  }
};
