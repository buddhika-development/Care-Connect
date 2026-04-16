import { GetPaymentStatusUsecase } from "../usecases/getPaymentStatus.usecase.js";

export async function GetPaymentStatusController(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    const payment = await GetPaymentStatusUsecase(appointmentId, userId, role);

    res.status(200).json({
      success: true,
      message: "Payment status retrieved successfully",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}
