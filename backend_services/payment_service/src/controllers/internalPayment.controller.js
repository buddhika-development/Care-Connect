import { RefundPaymentInternalUsecase } from "../usecases/refundPaymentInternal.usecase.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";

export async function RefundPaymentInternalController(req, res, next) {
  try {
    const { paymentId } = req.params;

    const result = await RefundPaymentInternalUsecase(paymentId);

    return ApiResponse.success(res, {
      message: "Payment status updated to refunded",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
