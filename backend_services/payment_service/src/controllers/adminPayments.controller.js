import {
  GetAdminPaymentsUsecase,
  GetAdminPaymentSummaryUsecase,
} from "../usecases/adminPayments.usecase.js";

export async function GetAdminPaymentsController(req, res, next) {
  try {
    const role = req.user?.role;

    const data = await GetAdminPaymentsUsecase(role);

    return res.status(200).json({
      success: true,
      message: "Payments retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function GetAdminPaymentSummaryController(req, res, next) {
  try {
    const role = req.user?.role;

    const data = await GetAdminPaymentSummaryUsecase(role);

    return res.status(200).json({
      success: true,
      message: "Payment summary retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
