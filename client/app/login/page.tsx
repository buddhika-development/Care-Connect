'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Heart, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AxiosError } from 'axios';

// ─── Validation schema ───────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(4, 'Password must be at least 4 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Error message extractor ─────────────────────────────────────────────────
function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message as string | undefined;
    if (msg) {
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('incorrect')) {
        return 'Incorrect email or password. Please try again.';
      }
      if (msg.toLowerCase().includes('not active') || msg.toLowerCase().includes('inactive')) {
        return 'Your account is not active. Please contact support.';
      }
      if (msg.toLowerCase().includes('not verified')) {
        return 'Your doctor account is pending admin verification. Please wait for approval.';
      }
      return msg;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Unable to connect to server. Please check your connection.';
    }
  }
  return 'Something went wrong. Please try again.';
}

// ─── Inner component that uses useSearchParams ───────────────────────────────
function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from');

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      await login(data.email.trim().toLowerCase(), data.password);
      const roleCookie = document.cookie
        .split(';')
        .find((c) => c.trim().startsWith('role='))
        ?.split('=')[1]
        ?.trim();

      if (redirectTo && !redirectTo.startsWith('/login') && !redirectTo.startsWith('/signup')) {
        router.push(redirectTo);
      } else if (roleCookie) {
        router.push(`/${roleCookie}/dashboard`);
      } else {
        router.push('/patient/dashboard');
      }
    } catch (err) {
      setServerError(extractErrorMessage(err));
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full pl-11 pr-4 py-3 rounded-xl border ${
      hasError ? 'border-error bg-error-light/30' : 'border-border bg-background'
    } text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all`;

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* ── Left decorative panel (desktop) ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-text flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-bold text-white text-xl">CareConnect</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Your health journey<br />
            <span className="text-primary-light">starts here.</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            Access your appointments, connect with doctors, and manage your health records — all from one secure platform.
          </p>
          <div className="space-y-3">
            {[
              'Book appointments in seconds',
              'Consult doctors via video call',
              'AI-powered health guidance',
              'Secure digital prescriptions',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-3 h-3 text-primary-light" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600 relative">© 2025 CareConnect · Sri Lanka</p>
      </div>

      {/* ── Right: login form ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-text text-lg">CareConnect</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Welcome back</h1>
            <p className="text-text-secondary text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Server-level error */}
            {serverError && (
              <div className="flex items-start gap-3 p-3.5 bg-error-light border border-error/20 rounded-xl text-sm text-error">
                <span className="text-base leading-5 flex-shrink-0">⚠️</span>
                <span>{serverError}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={inputClass(!!errors.email)}
                />
              </div>
              {errors.email && (
                <p className="text-error text-xs mt-1.5 flex items-center gap-1">
                  <span>❌</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-text" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`${inputClass(!!errors.password)} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-xs mt-1.5 flex items-center gap-1">
                  <span>❌</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-text-muted bg-secondary px-3">
              New to CareConnect?
            </div>
          </div>

          <Link
            href="/signup"
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-border hover:border-primary bg-card text-text font-semibold text-sm transition-all hover:bg-primary-50"
          >
            Create a patient account
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-center text-xs text-text-muted mt-6">
            Are you a doctor?{' '}
            <span className="text-text-secondary">Contact your hospital admin to get access.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Suspense wrapper ─────────────────────────────────────────────────────────
// Required by Next.js because LoginForm uses useSearchParams()
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
