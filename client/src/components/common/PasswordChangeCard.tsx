"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LockKeyhole, Save } from "lucide-react";
import { toast } from "sonner";
import { changePasswordApi } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/\d/, "Password must include at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>\-_=+\/\\[\]`~;]/,
        "Password must include at least one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function PasswordChangeCard() {
  const router = useRouter();
  const { logout } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: PasswordFormData) => {
    try {
      toast.info("After changing your password, you will be logged out.");
      await changePasswordApi(values);
      toast.success("Password updated successfully");
      reset();
      await logout();
      router.push("/login");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update password";
      toast.error(message);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:bg-secondary disabled:text-text-secondary disabled:cursor-not-allowed pr-12";

  const renderPasswordInput = (
    name: keyof PasswordFormData,
    label: string,
    placeholder: string,
    visible: boolean,
    setVisible: (value: boolean) => void,
    autoComplete: string,
  ) => {
    const error = errors[name];

    return (
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          {label}
        </label>
        <div className="relative">
          <input
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            placeholder={placeholder}
            {...register(name)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-text-muted hover:text-text"
            aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          >
            {visible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {error && <p className="text-error text-xs mt-1">{error.message}</p>}
      </div>
    );
  };

  return (
    <aside className="bg-card rounded-2xl border border-border shadow-card p-6 lg:sticky lg:top-6 self-start">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <LockKeyhole className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-text">Change Password</h2>
          <p className="text-xs text-text-muted">Keep your account secure</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {renderPasswordInput(
          "currentPassword",
          "Current Password",
          "Enter current password",
          showCurrent,
          setShowCurrent,
          "current-password",
        )}
        {renderPasswordInput(
          "newPassword",
          "New Password",
          "Enter new password",
          showNew,
          setShowNew,
          "new-password",
        )}
        {renderPasswordInput(
          "confirmPassword",
          "Confirm New Password",
          "Re-enter new password",
          showConfirm,
          setShowConfirm,
          "new-password",
        )}

        <div className="rounded-xl bg-secondary p-3 text-xs text-text-secondary leading-5 space-y-1">
          <p>Password rules:</p>
          <p>• At least 8 characters</p>
          <p>
            • One uppercase, one lowercase, one number, one special character
          </p>
          <p className="text-primary font-medium">
            After changing your password, you will be logged out automatically.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>
    </aside>
  );
}
