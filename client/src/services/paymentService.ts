import { apiClient } from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayhereCheckoutData {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
}

export interface InitiatePaymentResponse {
  checkoutData: PayhereCheckoutData;
  paymentUrl: string;
}

export type PaymentStatusValue =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "chargedback"
  | "unknown";

export interface PaymentStatus {
  appointmentId: string;
  patientId: string;
  amount: string;
  currency: string;
  status: PaymentStatusValue;
  payherePaymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Step 1 of payment: tell the backend to prepare a PayHere checkout session.
 * Returns the full checkout payload and the PayHere endpoint URL.
 */
export async function initiatePayment(data: {
  appointmentId: string;
  amount: number;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
}): Promise<InitiatePaymentResponse> {
  const { data: res } = await apiClient.post("/api/payments/initiate", {
    appointmentId: data.appointmentId,
    amount: data.amount,
    patientName: data.patientName,
    patientEmail: data.patientEmail,
    patientPhone: data.patientPhone ?? "",
  });
  return res.data as InitiatePaymentResponse;
}

/**
 * Poll the payment status for a given appointment.
 * Called by /payment/return page after PayHere redirects back.
 */
export async function getPaymentStatus(
  appointmentId: string,
): Promise<PaymentStatus> {
  const { data } = await apiClient.get(`/api/payments/status/${appointmentId}`);
  return data.data as PaymentStatus;
}

// ─── PayHere form submit helper ───────────────────────────────────────────────

/**
 * Builds a hidden HTML <form> with all checkoutData fields and submits it via
 * POST to `paymentUrl` (the PayHere sandbox URL).
 *
 * This causes the browser to navigate AWAY to PayHere's checkout page.
 * Make sure to store the appointmentId in sessionStorage BEFORE calling this,
 * so the /payment/return page can pick it up after the redirect comes back.
 */
export function submitPayhereForm(
  checkoutData: PayhereCheckoutData,
  paymentUrl: string,
): void {
  if (typeof document === "undefined") return;

  // Remove any stale form from a previous attempt
  const existingForm = document.getElementById("payhere-checkout-form");
  if (existingForm) existingForm.remove();

  const form = document.createElement("form");
  form.id = "payhere-checkout-form";
  form.method = "POST";
  form.action = paymentUrl;

  Object.entries(checkoutData).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value ?? "");
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

// ─── Admin stubs (TODO: replace with real admin API) ─────────────────────────

export interface AdminPayment {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  amount: number;
  currency: string;
  status:
    | "pending"
    | "completed"
    | "failed"
    | "cancelled"
    | "refunded"
    | "chargedback"
    | "unknown";
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  failedPayments: number;
  cancelledPayments: number;
}

export async function getPayments(): Promise<AdminPayment[]> {
  const { data } = await apiClient.get("/api/payments/admin/all");
  return data.data ?? [];
}

export async function getPaymentSummary(): Promise<PaymentSummary> {
  const { data } = await apiClient.get("/api/payments/admin/summary");
  return (
    data.data ?? {
      totalPayments: 0,
      totalAmount: 0,
      completedPayments: 0,
      pendingPayments: 0,
      refundedPayments: 0,
      failedPayments: 0,
      cancelledPayments: 0,
    }
  );
}
