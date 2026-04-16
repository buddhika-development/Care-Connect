import { InitiatePaymentUsecase } from "../usecases/initiatePayment.usecase.js";

export async function InitiatePaymentController(req, res, next) {
  try {
    const patientId = req.user.userId;

    const result = await InitiatePaymentUsecase(patientId, req.body);

    res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
