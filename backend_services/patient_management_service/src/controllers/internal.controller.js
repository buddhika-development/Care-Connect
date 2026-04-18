import { ApiResponse } from "../utils/apiResponse.utils.js";
import { GetPatientProfilesInternalUsecase } from "../usecases/getPatientProfilesInternal.usecase.js";

export const GetPatientProfilesInternalController = async (req, res, next) => {
  try {
    const result = await GetPatientProfilesInternalUsecase(req.query.userIds);

    if (result.success) {
      return ApiResponse.success(res, {
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    next(error);
  }
};
