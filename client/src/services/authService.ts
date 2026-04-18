import { apiClient } from "@/lib/axios";
import { UserRole } from "@/types/common";

// ─── Shapes ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  completeProfile: boolean;
  isVerified: boolean;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export async function loginApi(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await apiClient.post("/api/auth/login", { email, password });
  const d = data.data;
  return {
    accessToken: d.accessToken,
    user: {
      id: d.userId,
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      role: d.role,
      completeProfile: d.complete_profile,
      isVerified: !!d.is_verified,
      isActive: d.is_active ?? true,
    },
  };
}

export async function registerPatientApi(payload: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}): Promise<{ email: string; firstName: string; lastName: string }> {
  // Doctors are added by admin only — we NEVER pass 'doctor' role here
  const { data } = await apiClient.post("/api/auth/register", {
    ...payload,
    role: "patient",
  });
  const d = data.data;
  return { email: d.email, firstName: d.firstName, lastName: d.lastName };
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/api/auth/logout");
}

export async function refreshSessionApi(): Promise<LoginResponse> {
  const { data } = await apiClient.get("/api/auth/refresh-token");
  const d = data.data;
  return {
    accessToken: d.accessToken,
    user: {
      id: d.userId,
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      role: d.role,
      completeProfile: d.complete_profile ?? true,
      isVerified: !!d.is_verified,
      isActive: d.is_active ?? true,
    },
  };
}

export async function changePasswordApi(
  payload: ChangePasswordRequest,
): Promise<{ userId: string; updatedAt?: string }> {
  const { data } = await apiClient.patch("/api/auth/change-password", payload);
  return data.data;
}
