"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, LayoutDashboard, BrainCircuit, FileText, 
  Layers, Calendar, BarChart3, Clock, Users, Settings, Target 
} from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "AI Tutor", icon: BrainCircuit, href: "/dashboard/tutor" },
  { label: "Notes", icon: FileText, href: "/dashboard/notes" },
  { label: "Flashcards", icon: Layers, href: "/dashboard/flashcards" },
  { label: "Quizzes", icon: Target, href: "/dashboard/quiz" },
  { label: "Planner", icon: Calendar, href: "/dashboard/planner" },
  { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { label: "Pomodoro", icon: Clock, href: "/dashboard/pomodoro" },
  { label: "Community", icon: Users, href: "/dashboard/community" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">
            StudyFlow
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              pathname === route.href 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <route.icon className={cn(
              "w-5 h-5",
              pathname === route.href ? "text-primary" : "text-muted-foreground"
            )} />
            {route.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
