import { ForbiddenError } from "../utils/errors.utils.js";
import { findAllPayments } from "../repositories/payment.repository.js";
import { getPatientProfilesByUserIds } from "../utils/patientServiceHelper.js";

function buildPatientName(profile = {}) {
  const fullName = [profile.first_name, profile.last_name]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Unknown Patient";
}

function normalizeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function assertAdmin(role) {
  if (role !== "admin") {
    throw new ForbiddenError("Access forbidden: admin only");
  }
}

export async function GetAdminPaymentsUsecase(role) {
  assertAdmin(role);

  const payments = await findAllPayments();

  if (!payments.length) {
    return [];
  }

  const patientIds = [
    ...new Set(payments.map((payment) => payment.patient_id)),
  ];

  let patientProfiles = [];
  try {
    patientProfiles = await getPatientProfilesByUserIds(patientIds);
  } catch (error) {
    console.error(
      "Failed to fetch patient profiles for admin payments:",
      error.message,
    );
  }

  const patientMap = new Map(
    (patientProfiles || []).map((profile) => [profile.user_id, profile]),
  );

  return payments.map((payment) => {
    const profile = patientMap.get(payment.patient_id);

    return {
      id: payment.id,
      appointmentId: payment.appointment_id,
      patientId: payment.patient_id,
      patientName: buildPatientName(profile),
      amount: normalizeAmount(payment.amount),
      currency: payment.currency || "LKR",
      status: payment.status || "pending",
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    };
  });
}

export async function GetAdminPaymentSummaryUsecase(role) {
  assertAdmin(role);

  const payments = await findAllPayments();

  const summary = {
    totalPayments: payments.length,
    totalAmount: 0,
    completedPayments: 0,
    pendingPayments: 0,
    refundedPayments: 0,
    failedPayments: 0,
    cancelledPayments: 0,
  };

  for (const payment of payments) {
    const amount = normalizeAmount(payment.amount);
    summary.totalAmount += amount;

    if (payment.status === "completed") summary.completedPayments += 1;
    if (payment.status === "pending") summary.pendingPayments += 1;
    if (payment.status === "refunded") summary.refundedPayments += 1;
    if (payment.status === "failed") summary.failedPayments += 1;
    if (payment.status === "cancelled") summary.cancelledPayments += 1;
  }

  summary.totalAmount = Number(summary.totalAmount.toFixed(2));

  return summary;
}
