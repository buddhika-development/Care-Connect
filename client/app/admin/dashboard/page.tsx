"use client";

import Link from "next/link";
import {
  Activity,
  Calendar,
  CreditCard,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";
import StatsCard from "@/components/common/StatsCard";
import StatusBadge from "@/components/common/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAllDoctorsAdmin } from "@/hooks/useDoctor";
import { useAdminAppointments } from "@/hooks/useAppointments";
import { usePayments } from "@/hooks/usePayments";

function DashSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 skeleton rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 skeleton rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 skeleton rounded-2xl" />
        ))}
      </div>
      <div className="h-80 skeleton rounded-2xl" />
    </div>
  );
}

function formatShortDate(isoDate: string) {
  if (!isoDate) return "-";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-LK", { month: "short", day: "2-digit" });
}

function lastNDates(n: number) {
  const result: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export default function AdminDashboard() {
  const { data: users, isLoading: usersLoading } = useAdminUsers({});
  const { data: doctors, isLoading: doctorsLoading } = useAllDoctorsAdmin();
  const { data: appointments, isLoading: appointmentsLoading } =
    useAdminAppointments();
  const { data: payments, isLoading: paymentsLoading } = usePayments();

  if (
    usersLoading ||
    doctorsLoading ||
    appointmentsLoading ||
    paymentsLoading
  ) {
    return <DashSkeleton />;
  }

  const safeUsers = users ?? [];
  const safeDoctors = doctors ?? [];
  const safeAppointments = appointments ?? [];
  const safePayments = payments ?? [];

  const totalUsers = safeUsers.length;
  const activeUsers = safeUsers.filter((u) => u.isActive).length;
  const totalDoctors = safeDoctors.length;
  const verifiedDoctors = safeDoctors.filter((d) => d.isVerified).length;
  const pendingDoctors = safeDoctors.filter((d) => !d.isVerified).length;

  const totalAppointments = safeAppointments.length;
  const completedAppointments = safeAppointments.filter(
    (a) => a.status === "completed",
  ).length;
  const ongoingAppointments = safeAppointments.filter(
    (a) => a.status === "ongoing",
  ).length;
  const completionRate =
    totalAppointments > 0
      ? Math.round((completedAppointments / totalAppointments) * 100)
      : 0;

  const completedRevenue = safePayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const refundedRevenue = safePayments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const netRevenue = completedRevenue - refundedRevenue;

  const dates = lastNDates(7);

  const appointmentsByDate = new Map<string, number>(dates.map((d) => [d, 0]));
  for (const appointment of safeAppointments) {
    const key = appointment.date;
    if (appointmentsByDate.has(key)) {
      appointmentsByDate.set(key, (appointmentsByDate.get(key) || 0) + 1);
    }
  }
  const appointmentTrend = dates.map((date) => ({
    date,
    count: appointmentsByDate.get(date) || 0,
  }));

  const revenueByDate = new Map<string, number>(dates.map((d) => [d, 0]));
  for (const payment of safePayments) {
    const key = payment.createdAt?.slice(0, 10);
    if (!key || !revenueByDate.has(key)) continue;
    const amount = Number(payment.amount) || 0;
    if (payment.status === "completed") {
      revenueByDate.set(key, (revenueByDate.get(key) || 0) + amount);
    }
    if (payment.status === "refunded") {
      revenueByDate.set(key, (revenueByDate.get(key) || 0) - amount);
    }
  }
  const revenueTrend = dates.map((date) => ({
    date,
    amount: revenueByDate.get(date) || 0,
  }));

  const maxAppointmentsInTrend = Math.max(
    ...appointmentTrend.map((item) => item.count),
    1,
  );
  const maxRevenueInTrend = Math.max(
    ...revenueTrend.map((item) => Math.max(item.amount, 0)),
    1,
  );

  const doctorLeaderboardMap = new Map<
    string,
    {
      doctorName: string;
      totalAppointments: number;
      completedAppointments: number;
      estimatedRevenue: number;
    }
  >();

  for (const appointment of safeAppointments) {
    if (
      !appointment.doctorName ||
      appointment.doctorName === "Unknown Doctor"
    ) {
      continue;
    }

    const key = appointment.doctorId || appointment.doctorName;
    const current = doctorLeaderboardMap.get(key) || {
      doctorName: appointment.doctorName,
      totalAppointments: 0,
      completedAppointments: 0,
      estimatedRevenue: 0,
    };

    current.totalAppointments += 1;
    if (appointment.status === "completed") {
      current.completedAppointments += 1;
    }
    current.estimatedRevenue += Number(appointment.fee) || 0;

    doctorLeaderboardMap.set(key, current);
  }

  const topDoctors = [...doctorLeaderboardMap.values()]
    .sort((a, b) => b.totalAppointments - a.totalAppointments)
    .slice(0, 5);

  const recentAppointments = [...safeAppointments]
    .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1))
    .slice(0, 6);

  const pendingPayments = safePayments.filter(
    (p) => p.status === "pending",
  ).length;
  const failedPayments = safePayments.filter(
    (p) => p.status === "failed",
  ).length;

  return (
    <div className="space-y-6">
      <div className="bg-text rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -right-8 -top-8 w-56 h-56 rounded-full bg-white" />
        </div>
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Command Center</h1>
              <p className="text-gray-300 text-sm mt-0.5">
                Real-time platform analytics, trends, and operational insights
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-300">
            Data windows: last 7 days trends, live totals
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          label="Total Users"
          value={totalUsers}
          icon={Users}
          color="primary"
        />
        <StatsCard
          label="Active Users"
          value={activeUsers}
          icon={Activity}
          color="success"
        />
        <StatsCard
          label="Doctors"
          value={totalDoctors}
          icon={Stethoscope}
          color="accent"
        />
        <StatsCard
          label="Appointments"
          value={totalAppointments}
          icon={Calendar}
          color="warning"
        />
        <StatsCard
          label="Net Revenue"
          value={formatCurrency(netRevenue)}
          icon={CreditCard}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text">
              Appointment Trend (7 Days)
            </h2>
            <p className="text-xs text-text-muted">Daily bookings</p>
          </div>
          <div className="h-44 flex items-end gap-2">
            {appointmentTrend.map((point) => (
              <div
                key={point.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="text-[10px] text-text-muted">{point.count}</div>
                <div
                  className="w-full rounded-t-md bg-primary/80"
                  style={{
                    height: `${Math.max(8, (point.count / maxAppointmentsInTrend) * 130)}px`,
                  }}
                />
                <div className="text-[10px] text-text-muted">
                  {formatShortDate(point.date)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text">Revenue Trend (7 Days)</h2>
            <p className="text-xs text-text-muted">Completed minus refunded</p>
          </div>
          <div className="h-44 flex items-end gap-2">
            {revenueTrend.map((point) => (
              <div
                key={point.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="text-[10px] text-text-muted">
                  {formatCurrency(point.amount)}
                </div>
                <div
                  className={`w-full rounded-t-md ${point.amount >= 0 ? "bg-success/80" : "bg-error/80"}`}
                  style={{
                    height: `${Math.max(8, (Math.max(point.amount, 0) / maxRevenueInTrend) * 130)}px`,
                  }}
                />
                <div className="text-[10px] text-text-muted">
                  {formatShortDate(point.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text">Doctor Leaderboard</h2>
            <Link
              href="/admin/appointments"
              className="text-xs text-primary hover:underline"
            >
              View Appointments
            </Link>
          </div>

          {topDoctors.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">
              No doctor appointment data available yet.
            </p>
          ) : (
            <div className="space-y-2">
              {topDoctors.map((doctor, index) => {
                const completion =
                  doctor.totalAppointments > 0
                    ? Math.round(
                        (doctor.completedAppointments /
                          doctor.totalAppointments) *
                          100,
                      )
                    : 0;

                return (
                  <div
                    key={`${doctor.doctorName}-${index}`}
                    className="rounded-xl border border-border-light p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text truncate">
                        #{index + 1} {doctor.doctorName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {doctor.totalAppointments} appointments · {completion}%
                        completed
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-success shrink-0">
                      {formatCurrency(doctor.estimatedRevenue)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-5 space-y-3">
          <h2 className="font-semibold text-text mb-1">Operational Signals</h2>
          <div className="rounded-xl bg-secondary p-3">
            <p className="text-xs text-text-muted">Completion Rate</p>
            <p className="text-lg font-bold text-text">{completionRate}%</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {completedAppointments} of {totalAppointments} completed
            </p>
          </div>
          <div className="rounded-xl bg-secondary p-3">
            <p className="text-xs text-text-muted">Live Queue</p>
            <p className="text-sm text-text-secondary mt-1">
              Ongoing appointments:{" "}
              <span className="font-semibold text-text">
                {ongoingAppointments}
              </span>
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Pending payments:{" "}
              <span className="font-semibold text-text">{pendingPayments}</span>
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Failed payments:{" "}
              <span className="font-semibold text-text">{failedPayments}</span>
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Pending doctor verification:{" "}
              <span className="font-semibold text-text">{pendingDoctors}</span>
            </p>
          </div>
          <Link
            href="/admin/doctors"
            className="inline-flex text-xs text-primary hover:underline"
          >
            Review doctor verification queue
          </Link>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text">Recent Appointments</h2>
          <Link
            href="/admin/appointments"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-text">
                  {appointment.patientName}
                </p>
                <p className="text-xs text-text-secondary">
                  {appointment.doctorName} · {formatShortDate(appointment.date)}{" "}
                  · {appointment.consultationType}
                </p>
              </div>
              <StatusBadge status={appointment.status} size="sm" />
            </div>
          ))}
          {recentAppointments.length === 0 && (
            <p className="text-sm text-text-muted py-6 text-center">
              No recent appointments available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
