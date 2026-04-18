"use client";

import {
  Search,
  Users,
  HeartPulse,
  Stethoscope,
  CheckCircle2,
  ShieldCheck,
  Power,
} from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  useAdminUsers,
  useUpdateAdminUserActiveStatus,
} from "@/hooks/useAdminUsers";
import { useAdminUsersUIStore } from "@/store/adminUsersStore";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function UserSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 skeleton rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 skeleton rounded w-36" />
          <div className="h-3 skeleton rounded w-52" />
        </div>
        <div className="h-6 skeleton rounded-full w-20" />
      </div>
    </div>
  );
}

type TabFilter = "all" | "patient" | "doctor" | "admin";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const search = useAdminUsersUIStore((s) => s.search);
  const roleFilter = useAdminUsersUIStore((s) => s.roleFilter);
  const statusFilter = useAdminUsersUIStore((s) => s.statusFilter);
  const setSearch = useAdminUsersUIStore((s) => s.setSearch);
  const setRoleFilter = useAdminUsersUIStore((s) => s.setRoleFilter);
  const setStatusFilter = useAdminUsersUIStore((s) => s.setStatusFilter);
  const resetFilters = useAdminUsersUIStore((s) => s.resetFilters);

  const {
    data: users,
    isLoading,
    isError,
    refetch,
  } = useAdminUsers({
    search,
    role: roleFilter === "all" ? undefined : roleFilter,
    status: statusFilter,
  });

  const { data: allUsers, isLoading: isStatsLoading } = useAdminUsers({});

  const { mutate: updateActiveStatus, isPending: updatingStatus } =
    useUpdateAdminUserActiveStatus();

  const normalizedUsers = (users ?? []).map((u) => ({
    ...u,
    name: `${u.role === "doctor" ? "Dr. " : ""}${u.firstName} ${u.lastName}`.trim(),
    profileComplete: u.completeProfile,
    badge: u.role === "doctor" ? (u.isVerified ? "Verified" : "Pending") : null,
  }));

  const totalUsers = allUsers?.length ?? 0;
  const activeUsers = (allUsers ?? []).filter((u) => u.isActive).length;
  const patientCount = (allUsers ?? []).filter(
    (u) => u.role === "patient",
  ).length;
  const doctorCount = (allUsers ?? []).filter(
    (u) => u.role === "doctor",
  ).length;
  const adminCount = (allUsers ?? []).filter((u) => u.role === "admin").length;
  const verifiedDoctors = (allUsers ?? []).filter(
    (u) => u.role === "doctor" && u.isVerified,
  ).length;

  const TABS: { key: TabFilter; label: string; count: number }[] = [
    { key: "all", label: "All Users", count: totalUsers },
    { key: "patient", label: "Patients", count: patientCount },
    { key: "doctor", label: "Doctors", count: doctorCount },
    { key: "admin", label: "Admins", count: adminCount },
  ];

  const ROLE_STYLES = {
    patient: {
      avatar: "bg-primary-50 text-primary",
      badge: "bg-primary-50 text-primary",
      icon: HeartPulse,
    },
    doctor: {
      avatar: "bg-orange-50 text-accent",
      badge: "bg-orange-50 text-accent",
      icon: Stethoscope,
    },
    admin: {
      avatar: "bg-secondary text-text",
      badge: "bg-secondary text-text",
      icon: ShieldCheck,
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">User Management</h1>
        <p className="text-text-secondary text-sm mt-1">
          View and manage all registered patients and doctors
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Users",
            value: totalUsers,
            icon: Users,
            color: "text-text",
            bg: "bg-secondary",
          },
          {
            label: "Active Users",
            value: activeUsers,
            icon: Power,
            color: "text-success",
            bg: "bg-success-light",
          },
          {
            label: "Patients",
            value: patientCount,
            icon: HeartPulse,
            color: "text-primary",
            bg: "bg-primary-50",
          },
          {
            label: "Doctors",
            value: doctorCount,
            icon: Stethoscope,
            color: "text-accent",
            bg: "bg-orange-50",
          },
          {
            label: "Verified Doctors",
            value: verifiedDoctors,
            icon: ShieldCheck,
            color: "text-primary",
            bg: "bg-primary-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-2xl border border-border shadow-card p-4 flex items-center gap-4"
          >
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                s.bg,
              )}
            >
              <s.icon className={cn("w-5 h-5", s.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {isStatsLoading ? "—" : s.value}
              </p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Tabs */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setRoleFilter(t.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-medium transition-all",
                roleFilter === t.key
                  ? "bg-primary text-white"
                  : "bg-secondary text-text-secondary hover:bg-border",
              )}
            >
              {t.label} ({isStatsLoading ? "…" : t.count})
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize",
                statusFilter === status
                  ? "bg-accent text-white"
                  : "bg-secondary text-text-secondary hover:bg-border",
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <UserSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-error font-medium mb-3">
            Failed to load user data.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm"
          >
            Retry
          </button>
        </div>
      ) : normalizedUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No users match your search criteria."
          action={{ label: "Clear Filters", onClick: resetFilters }}
        />
      ) : (
        <div className="space-y-2">
          {normalizedUsers.map((user) => {
            const style =
              ROLE_STYLES[user.role as keyof typeof ROLE_STYLES] ||
              ROLE_STYLES.admin;
            const RoleIcon = style.icon;
            const isCurrentAdmin = user.id === currentUser?.id;
            const canToggle = !(isCurrentAdmin && user.isActive);

            return (
              <div
                key={`${user.role}-${user.id}`}
                className="bg-card rounded-2xl border border-border shadow-card p-4"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      style.avatar,
                    )}
                  >
                    {user.name
                      .replace("Dr. ", "")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text text-sm">
                        {user.name}
                      </p>
                      {/* Role badge */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                          style.badge,
                        )}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {user.role}
                      </span>
                      {/* Doctor verification badge */}
                      {user.badge && (
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            user.badge === "Verified"
                              ? "bg-success-light text-success"
                              : "bg-warning-light text-warning",
                          )}
                        >
                          {user.badge === "Verified" ? "✓ " : ""}
                          {user.badge}
                        </span>
                      )}
                      {/* Patient profile status */}
                      {user.role === "patient" && (
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            user.profileComplete
                              ? "bg-success-light text-success"
                              : "bg-secondary text-text-muted",
                          )}
                        >
                          {user.profileComplete ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Profile
                              complete
                            </span>
                          ) : (
                            "Profile incomplete"
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Status dot */}
                  <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        user.isActive ? "bg-success" : "bg-warning",
                      )}
                    />
                    {user.isActive ? "Active" : "Inactive"}
                  </div>

                  <div className="shrink-0">
                    <button
                      disabled={updatingStatus || !canToggle}
                      onClick={() => {
                        updateActiveStatus(
                          { userId: user.id, isActive: !user.isActive },
                          {
                            onSuccess: () => {
                              toast.success(
                                `User ${!user.isActive ? "activated" : "deactivated"} successfully.`,
                              );
                            },
                            onError: (error: unknown) => {
                              const msg =
                                error instanceof Error
                                  ? error.message
                                  : "Failed to update user status.";
                              toast.error(msg);
                            },
                          },
                        );
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        user.isActive
                          ? "border-error text-error hover:bg-error-light"
                          : "border-success text-success hover:bg-success-light",
                        (!canToggle || updatingStatus) &&
                          "opacity-50 cursor-not-allowed hover:bg-transparent",
                      )}
                      title={
                        !canToggle
                          ? "You cannot deactivate your own account"
                          : user.isActive
                            ? "Deactivate user"
                            : "Activate user"
                      }
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
