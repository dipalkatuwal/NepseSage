import { AppLayout } from "@/components/layout/AppLayout";
import { PortfolioProvider } from "@/context/PortfolioContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortfolioProvider>
      <AppLayout>{children}</AppLayout>
    </PortfolioProvider>
  );
}
