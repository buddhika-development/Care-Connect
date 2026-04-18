import {
  GetAdminUsersUsecase,
  UpdateDoctorVerificationStatusUsecase,
  UpdateUserActiveStatusUsecase,
} from "../usecases/adminUsers.usecases.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";

export const getAdminUsersController = async (req, res, next) => {
  try {
    const users = await GetAdminUsersUsecase(req.query);

    return ApiResponse.success(res, {
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error in getAdminUsersController:", error);
    next(error);
  }
};

export const updateUserActiveStatusController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const result = await UpdateUserActiveStatusUsecase(
      userId,
      isActive,
      req.user.userId,
    );

    return ApiResponse.success(res, {
      message: `User has been ${isActive ? "activated" : "deactivated"} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Error in updateUserActiveStatusController:", error);
    next(error);
  }
};

export const updateDoctorVerificationStatusController = async (
  req,
  res,
  next,
) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    const result = await UpdateDoctorVerificationStatusUsecase(
      userId,
      isVerified,
    );

    return ApiResponse.success(res, {
      message: `Doctor has been ${isVerified ? "verified" : "unverified"} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Error in updateDoctorVerificationStatusController:", error);
    next(error);
  }
};
