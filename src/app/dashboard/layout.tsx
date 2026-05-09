import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { DashboardRightSidebar } from "@/components/dashboard-right-sidebar";
import { StudyDataHydrator } from "@/components/study-data-hydrator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <StudyDataHydrator />
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar />
        <main className="flex-1 overflow-hidden bg-muted/30">
          <div className="flex h-full">
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
              {children}
            </div>
            <DashboardRightSidebar />
          </div>
        </main>
      </div>
    </div>
  );
}
