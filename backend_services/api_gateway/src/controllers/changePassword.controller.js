import { ApiResponse } from "../utils/apiResponse.utils.js";
import { changePasswordUsecase } from "../usecases/changePassword.usecases.js";

export async function changePasswordController(req, res, next) {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const result = await changePasswordUsecase({
      userId,
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (result.success) {
      return ApiResponse.success(res, {
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    next(error);
  }
}
