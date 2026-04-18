"use client";

import {
  Check,
  Search,
  Stethoscope,
  UserRound,
  BadgeCheck,
  Plus,
} from "lucide-react";
import {
  useAllDoctorsAdmin,
  useCreateDoctorByAdmin,
  useVerifyDoctor,
} from "@/hooks/useDoctor";
import EmptyState from "@/components/common/EmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAdminDoctorsUIStore } from "@/store/adminDoctorsStore";

function AddDoctorModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => void;
  isSubmitting: boolean;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const generateStrongPassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const digits = "23456789";
    const symbols = "!@#$%^&*";
    const all = `${upper}${lower}${digits}${symbols}`;

    let generated = "";
    generated += upper[Math.floor(Math.random() * upper.length)];
    generated += lower[Math.floor(Math.random() * lower.length)];
    generated += digits[Math.floor(Math.random() * digits.length)];
    generated += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = 0; i < 8; i += 1) {
      generated += all[Math.floor(Math.random() * all.length)];
    }

    const shuffled = generated
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setPassword(shuffled);
    toast.success("Strong password generated.");
  };

  if (!isOpen) return null;

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Add Doctor</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Create a basic doctor account with login credentials
            </p>
          </div>
          <button
            onClick={handleClose}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-border text-text-secondary hover:bg-secondary"
            disabled={isSubmitting}
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            />
          </div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="doctor@email.com"
            type="email"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSubmitting}
          />
          <div className="rounded-xl border border-border bg-background p-3 space-y-2">
            <p className="text-xs text-text-muted">
              Password is generated securely and hidden from admin view.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generateStrongPassword}
                className="px-3 py-2 rounded-lg bg-secondary text-text-secondary hover:bg-border text-xs font-medium transition-all"
                disabled={isSubmitting}
              >
                {password
                  ? "Regenerate Strong Password"
                  : "Generate Strong Password"}
              </button>
              <span className="text-xs font-medium text-success">
                {password ? "Password generated (hidden)" : "Not generated yet"}
              </span>
            </div>
          </div>

          <div className="bg-secondary rounded-xl p-3 text-xs text-text-muted">
            Role will be created as doctor and complete profile will be set to
            false. Credentials are emailed automatically. Admin cannot view the
            generated password.
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !password}
            className="w-full px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-all disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Doctor Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DoctorProfileModal({
  isOpen,
  onClose,
  doctor,
}: {
  isOpen: boolean;
  onClose: () => void;
  doctor: {
    firstName: string;
    lastName: string;
    specialization: string;
    email: string;
    roomNumber: string;
    experienceYears: number;
    licenseNumber: string;
    bio: string | null;
    availabilitiesCount: number;
    isVerified: boolean;
    isActive: boolean;
    completeProfile: boolean;
  } | null;
}) {
  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Doctor Profile</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Detailed professional information
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-border text-text-secondary hover:bg-secondary"
          >
            Close
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xl font-bold text-text">
              Dr. {doctor.firstName} {doctor.lastName}
            </p>
            <p className="text-sm text-primary">
              {doctor.specialization || "Not provided"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-secondary px-3 py-2">
              <span className="text-text-muted">Email:</span>{" "}
              <span className="text-text">
                {doctor.email || "Not available"}
              </span>
            </div>
            <div className="rounded-xl bg-secondary px-3 py-2">
              <span className="text-text-muted">Room:</span>{" "}
              <span className="text-text">
                {doctor.roomNumber || "Not set"}
              </span>
            </div>
            <div className="rounded-xl bg-secondary px-3 py-2">
              <span className="text-text-muted">Experience:</span>{" "}
              <span className="text-text">{doctor.experienceYears} years</span>
            </div>
            <div className="rounded-xl bg-secondary px-3 py-2">
              <span className="text-text-muted">License:</span>{" "}
              <span className="text-text">
                {doctor.licenseNumber || "Not set"}
              </span>
            </div>
            <div className="rounded-xl bg-secondary px-3 py-2">
              <span className="text-text-muted">Availabilities:</span>{" "}
              <span className="text-text">{doctor.availabilitiesCount}</span>
            </div>
            <div className="rounded-xl bg-secondary px-3 py-2">
              <span className="text-text-muted">Profile:</span>{" "}
              <span className="text-text">
                {doctor.completeProfile ? "Complete" : "Incomplete"}
              </span>
            </div>
            <div className="rounded-xl bg-secondary px-3 py-2">
              <span className="text-text-muted">Status:</span>{" "}
              <span className="text-text">
                {doctor.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="rounded-xl bg-secondary px-3 py-2">
              <span className="text-text-muted">Verification:</span>{" "}
              <span className="text-text">
                {doctor.isVerified ? "Verified" : "Pending"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-text mb-1">Bio</p>
            <p className="text-sm text-text-secondary rounded-xl border border-border bg-background px-3 py-2">
              {doctor.bio?.trim() || "No bio provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 skeleton rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton rounded w-32" />
          <div className="h-3 skeleton rounded w-48" />
        </div>
        <div className="h-8 skeleton rounded-xl w-20" />
      </div>
    </div>
  );
}

export default function AdminDoctorsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const search = useAdminDoctorsUIStore((s) => s.search);
  const filter = useAdminDoctorsUIStore((s) => s.filter);
  const selectedDoctorUserId = useAdminDoctorsUIStore(
    (s) => s.selectedDoctorUserId,
  );
  const setSearch = useAdminDoctorsUIStore((s) => s.setSearch);
  const setFilter = useAdminDoctorsUIStore((s) => s.setFilter);
  const openDoctorProfile = useAdminDoctorsUIStore((s) => s.openDoctorProfile);
  const closeDoctorProfile = useAdminDoctorsUIStore(
    (s) => s.closeDoctorProfile,
  );
  const resetFilters = useAdminDoctorsUIStore((s) => s.resetFilters);

  const { data: doctors, isLoading, isError, refetch } = useAllDoctorsAdmin();
  const { mutate: verifyDoctor, isPending } = useVerifyDoctor();
  const { mutate: createDoctorByAdmin, isPending: isCreatingDoctor } =
    useCreateDoctorByAdmin();

  const filtered = (doctors ?? []).filter((d) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "verified" ? d.isVerified : !d.isVerified);
    const matchesSearch =
      !search ||
      `${d.firstName} ${d.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedDoctor =
    (doctors ?? []).find((d) => d.userId === selectedDoctorUserId) ?? null;

  const total = doctors?.length ?? 0;
  const verified = doctors?.filter((d) => d.isVerified).length ?? 0;
  const pending = doctors?.filter((d) => !d.isVerified).length ?? 0;
  const active = doctors?.filter((d) => d.isActive).length ?? 0;

  const handleSetVerification = (doctorUserId: string, isVerified: boolean) => {
    verifyDoctor(
      { userId: doctorUserId, isVerified },
      {
        onSuccess: () =>
          toast.success(
            `Doctor marked as ${isVerified ? "verified" : "pending"} successfully.`,
          ),
        onError: () =>
          toast.error("Failed to update doctor verification status."),
      },
    );
  };

  const handleCreateDoctor = (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    createDoctorByAdmin(payload, {
      onSuccess: (result) => {
        if (result.credentialsEmailSent === false) {
          toast.warning(
            "Doctor account created, but sending credentials email failed.",
          );
        } else {
          toast.success("Doctor account created successfully.");
        }
        setIsAddModalOpen(false);
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to create doctor account.";
        toast.error(message);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Manage Doctors</h1>
        <p className="text-text-secondary text-sm mt-1">
          Verify and manage healthcare providers on the platform
        </p>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-all"
        >
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Doctors",
            value: total,
            icon: UserRound,
            tone: "bg-secondary text-text",
          },
          {
            label: "Verified",
            value: verified,
            icon: BadgeCheck,
            tone: "bg-success-light text-success",
          },
          {
            label: "Pending",
            value: pending,
            icon: Stethoscope,
            tone: "bg-warning-light text-warning",
          },
          {
            label: "Active Accounts",
            value: active,
            icon: Check,
            tone: "bg-primary-50 text-primary",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-2xl border border-border shadow-card p-4 flex items-center gap-3"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                s.tone,
              )}
            >
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-text">
                {isLoading ? "—" : s.value}
              </p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or specialization..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "verified", "pending"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${filter === f ? "bg-primary text-white" : "bg-secondary text-text-secondary hover:bg-border"}`}
            >
              {f === "all"
                ? `All (${total})`
                : f === "verified"
                  ? `Verified (${verified})`
                  : `Pending (${pending})`}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <DocSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-error font-medium mb-3">Failed to load doctors.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          description="No doctors match your search or filter criteria."
          action={{ label: "Clear Filters", onClick: resetFilters }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-card rounded-2xl border border-border shadow-card p-5"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0",
                    doc.isVerified
                      ? "bg-success-light text-success"
                      : "bg-warning-light text-warning",
                  )}
                >
                  {doc.firstName[0]}
                  {doc.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text">
                      Dr. {doc.firstName} {doc.lastName}
                    </p>
                    {doc.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-success-light text-success px-2 py-0.5 rounded-full font-medium">
                        <Check className="w-2.5 h-2.5" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-warning-light text-warning px-2 py-0.5 rounded-full font-medium">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {doc.specialization}
                  </p>
                  <p className="text-xs text-text-muted">
                    Room {doc.roomNumber || "N/A"} · {doc.experienceYears} yrs ·{" "}
                    {doc.email}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={doc.isVerified}
                      disabled={isPending}
                      onChange={(e) =>
                        handleSetVerification(doc.userId, e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <span
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-all border",
                        doc.isVerified
                          ? "bg-success border-success"
                          : "bg-secondary border-border",
                        isPending && "opacity-60",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                          doc.isVerified ? "left-5" : "left-0.5",
                        )}
                      />
                    </span>
                    <span>{doc.isVerified ? "Verified" : "Not Verified"}</span>
                  </label>
                  <button
                    onClick={() => openDoctorProfile(doc.userId)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary hover:bg-secondary text-xs font-medium rounded-xl transition-all"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DoctorProfileModal
        isOpen={!!selectedDoctorUserId}
        onClose={closeDoctorProfile}
        doctor={selectedDoctor}
      />

      <AddDoctorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateDoctor}
        isSubmitting={isCreatingDoctor}
      />
    </div>
  );
}
