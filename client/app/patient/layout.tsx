import DashboardLayout from '@/components/common/DashboardLayout';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
