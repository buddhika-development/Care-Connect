'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Heart, Lock, Mail, User, ArrowRight,
  Loader2, CheckCircle2, Info, ArrowLeft,
} from 'lucide-react';
import { AxiosError } from 'axios';
import { registerPatientApi } from '@/services/authService';
import { toast } from 'sonner';

// ─── Schema ──────────────────────────────────────────────────────────────────
const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name too long')
      .regex(/^[A-Za-z\s'-]+$/, 'First name can only contain letters'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name too long')
      .regex(/^[A-Za-z\s'-]+$/, 'Last name can only contain letters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

// ─── Error extractor ─────────────────────────────────────────────────────────
function extractError(error: unknown): string {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message as string | undefined;
    if (msg) {
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
        return 'An account with this email already exists. Please sign in instead.';
      }
      return msg;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Unable to connect. Please check your connection and try again.';
    }
  }
  return 'Registration failed. Please try again.';
}

// ─── Password strength indicator ─────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 6 characters', ok: password.length >= 6 },
    { label: 'Contains a number', ok: /\d/.test(password) },
    { label: 'Contains a letter', ok: /[a-zA-Z]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {checks.map((c) => (
        <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-success' : 'text-text-muted'}`}>
          <CheckCircle2 className={`w-3 h-3 ${c.ok ? 'text-success' : 'text-border'}`} />
          {c.label}
        </div>
      ))}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const password = watch('password', '');

  const onSubmit = async (data: SignupForm) => {
    setServerError(null);
    try {
      const result = await registerPatientApi({
        email: data.email.trim().toLowerCase(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        password: data.password,
      });
      setSuccess(true);
      toast.success(`Account created for ${result.firstName}!`, {
        description: 'Please sign in to continue.',
        duration: 5000,
      });
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setServerError(extractError(err));
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full pl-11 pr-4 py-3 rounded-xl border ${
      hasError ? 'border-error bg-error-light/30' : 'border-border bg-background'
    } text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all`;

  if (success) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
        <div className="bg-card rounded-3xl border border-border shadow-card p-10 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">Account created!</h2>
          <p className="text-text-secondary text-sm">Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* ── Left panel ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-text flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-bold text-white text-xl">CareConnect</span>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Join thousands of<br />
            <span className="text-primary-light">healthy Sri Lankans.</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            Create your free patient account and get access to the country&apos;s most trusted network of verified healthcare providers.
          </p>
          {/* Quick facts */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '1,200+', label: 'Verified Doctors' },
              { value: 'Free', label: 'For Patients' },
              { value: '3 min', label: 'Setup time' },
              { value: '24/7', label: 'AI Support' },
            ].map((f) => (
              <div key={f.label} className="bg-white/5 rounded-xl p-3">
                <p className="text-primary-light font-bold text-lg">{f.value}</p>
                <p className="text-gray-500 text-xs">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600 relative">© 2025 CareConnect · Sri Lanka</p>
      </div>

      {/* ── Right: form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-text text-lg">CareConnect</span>
          </div>

          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-text mb-2">Create your account</h1>
            <p className="text-text-secondary text-sm">Free forever for patients. No credit card required.</p>
          </div>

          {/* Doctor notice */}
          <div className="flex items-start gap-3 p-3.5 bg-primary-50 border border-primary-100 rounded-xl mb-6">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-primary leading-relaxed">
              <strong>Doctors:</strong> Registration is managed by your hospital administrator. Contact them for access.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {serverError && (
              <div className="flex items-start gap-3 p-3.5 bg-error-light border border-error/20 rounded-xl text-sm text-error">
                <span className="text-base leading-5 flex-shrink-0">⚠️</span>
                <span>{serverError}</span>
              </div>
            )}

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-text mb-1.5">First name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Kavindi"
                    {...register('firstName')}
                    className={inputClass(!!errors.firstName)}
                  />
                </div>
                {errors.firstName && <p className="text-error text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-text mb-1.5">Last name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Perera"
                    {...register('lastName')}
                    className={inputClass(!!errors.lastName)}
                  />
                </div>
                {errors.lastName && <p className="text-error text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="kavindi@example.com"
                  {...register('email')}
                  className={inputClass(!!errors.email)}
                />
              </div>
              {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  {...register('password')}
                  className={`${inputClass(!!errors.password)} pr-11`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
              <PasswordStrength password={password} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={`${inputClass(!!errors.confirmPassword)} pr-11`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-error text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create patient account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-text-muted bg-secondary px-3">
              Already have an account?
            </div>
          </div>

          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-border hover:border-primary bg-card text-text font-semibold text-sm transition-all hover:bg-primary-50"
          >
            Sign in instead
          </Link>

          <p className="text-center text-xs text-text-muted mt-6">
            By creating an account you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
