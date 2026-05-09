"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ANALYTICS_UPDATED_EVENT, readFocusLogs, readPlannerTasks, readQuizResults, toDateKey, type FocusLog, type PlannerTask, type QuizResult } from "@/lib/study-analytics";
import { BarChart3, CalendarCheck, Clock, Flame, Target, TrendingUp } from "lucide-react";

function getWeekDays() {
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + diffToMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date).slice(0, 1),
      key: toDateKey(date),
    };
  });
}

function formatHours(seconds: number) {
  const hours = seconds / 3600;
  if (hours < 1) return `${Math.round(seconds / 60)}m`;
  return `${hours.toFixed(1)}h`;
}

function getCurrentStreak(logs: FocusLog[]) {
  const activeDays = new Set(logs.filter((log) => log.seconds > 0).map((log) => log.date));
  let streak = 0;
  const cursor = new Date();

  while (activeDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function loadAnalyticsData() {
  return {
    focusLogs: readFocusLogs(),
    plannerTasks: readPlannerTasks(),
    quizResults: readQuizResults(),
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<{
    focusLogs: FocusLog[];
    plannerTasks: PlannerTask[];
    quizResults: QuizResult[];
  }>({
    focusLogs: [],
    plannerTasks: [],
    quizResults: [],
  });

  useEffect(() => {
    const sync = () => setData(loadAnalyticsData());

    sync();
    window.addEventListener(ANALYTICS_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);

    const interval = window.setInterval(sync, 5000);

    return () => {
      window.removeEventListener(ANALYTICS_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.clearInterval(interval);
    };
  }, []);

  const weekDays = useMemo(() => getWeekDays(), []);
  const weeklyFocus = weekDays.map((day) => data.focusLogs.find((log) => log.date === day.key)?.seconds || 0);
  const totalFocusSeconds = weeklyFocus.reduce((total, seconds) => total + seconds, 0);
  const maxFocusSeconds = Math.max(...weeklyFocus, 60);
  const completedTasks = data.plannerTasks.filter((task) => task.done).length;
  const taskCompletion = data.plannerTasks.length > 0
    ? Math.round((completedTasks / data.plannerTasks.length) * 100)
    : 0;
  const quizAttempts = data.quizResults.length;
  const quizAverage = quizAttempts > 0
    ? Math.round(
        data.quizResults.reduce((total, result) => total + (result.score / result.total) * 100, 0) / quizAttempts
      )
    : 0;
  const latestQuiz = data.quizResults[0];
  const currentStreak = getCurrentStreak(data.focusLogs);

  const summaryCards = [
    {
      label: "Study time",
      value: formatHours(totalFocusSeconds),
      icon: Clock,
      detail: "This week",
    },
    {
      label: "Quiz average",
      value: quizAttempts > 0 ? `${quizAverage}%` : "No quizzes",
      icon: Target,
      detail: quizAttempts > 0 ? `${quizAttempts} attempt${quizAttempts === 1 ? "" : "s"}` : "Take a quiz",
    },
    {
      label: "Current streak",
      value: `${currentStreak} day${currentStreak === 1 ? "" : "s"}`,
      icon: Flame,
      detail: "Focus sessions",
    },
    {
      label: "Tasks done",
      value: `${completedTasks}/${data.plannerTasks.length}`,
      icon: CalendarCheck,
      detail: `${taskCompletion}% complete`,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Live progress from your focus timer, quizzes, and planner tasks.</p>
        </div>
        <Badge variant="secondary" className="w-fit">Updates automatically</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <item.icon className="h-5 w-5 text-primary" />
                <Badge variant="secondary">{item.detail}</Badge>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Weekly Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-end gap-3">
              {weeklyFocus.map((seconds, index) => (
                <div key={weekDays[index].key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full items-end rounded-md bg-muted" style={{ height: "220px" }}>
                    <div
                      className="w-full rounded-md bg-primary transition-all"
                      style={{ height: `${Math.max((seconds / maxFocusSeconds) * 100, seconds > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{weekDays[index].label}</span>
                  <span className="text-[0.7rem] text-muted-foreground">{formatHours(seconds)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Live Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Planner completion</span>
                <span className="text-muted-foreground">{completedTasks}/{data.plannerTasks.length}</span>
              </div>
              <Progress value={taskCompletion} className="h-2" />
              <p className="text-xs text-muted-foreground">{taskCompletion}% of saved planner tasks are complete.</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Quiz performance</span>
                <span className="text-muted-foreground">{quizAttempts > 0 ? `${quizAverage}%` : "No data"}</span>
              </div>
              <Progress value={quizAverage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {latestQuiz ? `Latest score: ${latestQuiz.score}/${latestQuiz.total}` : "Complete a quiz to populate this metric."}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm font-medium">Data source</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Analytics are calculated from activity saved in this browser on this device.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
