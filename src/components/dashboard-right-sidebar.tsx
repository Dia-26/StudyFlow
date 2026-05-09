"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Target, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function DashboardRightSidebar() {
  return (
    <div className="w-80 border-l border-border bg-card/50 hidden xl:flex flex-col h-full p-6 space-y-6 overflow-y-auto shrink-0">
      
      {/* Motivation Widget */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-foreground">7 Day Streak!</h3>
          </div>
          <p className="text-sm text-muted-foreground">You&apos;re doing great. Keep the momentum going for your upcoming exams.</p>
        </CardContent>
      </Card>

      {/* Deadlines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Upcoming Deadlines
          </h3>
        </div>
        <div className="space-y-3">
          {[
            { title: "Calculus Midterm", time: "Tomorrow, 10:00 AM", color: "bg-destructive/10 text-destructive" },
            { title: "Physics Lab Report", time: "Friday, 11:59 PM", color: "bg-orange-500/10 text-orange-500" },
            { title: "History Essay", time: "Next Monday", color: "bg-primary/10 text-primary" }
          ].map((item, i) => (
            <div key={i} className="flex flex-col p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer">
              <span className="text-sm font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground mt-1">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-secondary" /> Daily Goal
        </h3>
        <Card className="shadow-none border-border bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Study Time</span>
              <span className="font-medium">2.5 / 4 hrs</span>
            </div>
            <Progress value={62} className="h-2" />
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
