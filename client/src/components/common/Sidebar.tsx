"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Calendar,
  FileText,
  Bot,
  Settings,
  LogOut,
  Stethoscope,
  Clock,
  Users,
  CreditCard,
  ShieldCheck,
  X,
  HeartPulse,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthUIStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { cn, getInitials } from "@/lib/utils";
import { UserRole } from "@/types/common";
import { toast } from "sonner";
import NotificationBell from "@/components/common/NotificationBell";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  patient: [
    {
      label: "Dashboard",
      href: "/patient/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Find a Doctor",
      href: "/patient/find-doctor",
      icon: <Search className="w-5 h-5" />,
    },
    {
      label: "My Appointments",
      href: "/patient/appointments",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: "Medical Records",
      href: "/patient/medical-records",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: "AI Health Assistant",
      href: "/patient/ai-assistant",
      icon: <Bot className="w-5 h-5" />,
    },
    {
      label: "Profile Settings",
      href: "/patient/profile",
      icon: <Settings className="w-5 h-5" />,
    },
  ],
  doctor: [
    {
      label: "Dashboard",
      href: "/doctor/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "My Schedule",
      href: "/doctor/schedule",
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: "Appointments",
      href: "/doctor/appointments",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: "Profile Settings",
      href: "/doctor/profile",
      icon: <Settings className="w-5 h-5" />,
    },
  ],
  admin: [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Doctors",
      href: "/admin/doctors",
      icon: <Stethoscope className="w-5 h-5" />,
    },
    {
      label: "Appointments",
      href: "/admin/appointments",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: "Payments",
      href: "/admin/payments",
      icon: <CreditCard className="w-5 h-5" />,
    },
  ],
};

const ROLE_COLORS: Record<UserRole, string> = {
  patient: "bg-primary",
  doctor: "bg-accent",
  admin: "bg-text",
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  patient: <HeartPulse className="w-4 h-4" />,
  doctor: <Stethoscope className="w-4 h-4" />,
  admin: <ShieldCheck className="w-4 h-4" />,
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const clearProfileSkip = useAuthUIStore((s) => s.clearProfileSkip);
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const handleLogout = async () => {
    try {
      await logout();
      clearProfileSkip();
      router.push("/login");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const role = user?.role;
  if (!role) return null;
  const navItems = NAV_ITEMS[role];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-text text-lg tracking-tight">
            CareConnect
          </span>
        </div>
        {/* Mobile close */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-text-secondary hover:bg-secondary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-4 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0",
                ROLE_COLORS[role],
              )}
            >
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs text-white px-2 py-0.5 rounded-full",
                    ROLE_COLORS[role],
                  )}
                >
                  {ROLE_ICONS[role]}
                  <span className="capitalize">{role}</span>
                </span>
                {/* Profile incomplete indicator */}
                {!user.completeProfile && role !== "admin" && (
                  <span className="text-xs text-warning bg-warning-light px-1.5 py-0.5 rounded-full font-medium">
                    Incomplete
                  </span>
                )}
              </div>
            </div>
            <NotificationBell />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto no-scrollbar">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:bg-secondary hover:text-text",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 shrink-0 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error-light transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col h-screen sticky top-0 bg-card border-r border-border shrink-0 overflow-visible z-50">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col md:hidden transform transition-transform duration-300 ease-in-out overflow-visible",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
