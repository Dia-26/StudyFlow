"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Circle, Plus } from "lucide-react";
import { ANALYTICS_UPDATED_EVENT, readPlannerTasks, savePlannerTasks, toDateKey, type PlannerTask } from "@/lib/study-analytics";

const initialTasks: PlannerTask[] = [
  { title: "Revise integration by parts", due: "Today", dueDate: "", done: false },
  { title: "Complete physics lab summary", due: "Friday", dueDate: "", done: false },
  { title: "Review chemistry flashcards", due: "Tonight", dueDate: "", done: true },
];

function formatDueDate(value: string) {
  if (!value) return "Unscheduled";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getCurrentWeek() {
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
      day: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
      date: date.getDate(),
      key: toDateKey(date),
      isToday: toDateKey(date) === toDateKey(today),
    };
  });
}

export default function PlannerPage() {
  const [tasks, setTasks] = useState<PlannerTask[]>(() => readPlannerTasks(initialTasks));
  const [taskTitle, setTaskTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const weekDays = getCurrentWeek();

  useEffect(() => {
    const syncTasks = () => setTasks(readPlannerTasks(initialTasks));

    window.addEventListener(ANALYTICS_UPDATED_EVENT, syncTasks);
    return () => window.removeEventListener(ANALYTICS_UPDATED_EVENT, syncTasks);
  }, []);

  const updateTasks = (getNextTasks: (currentTasks: PlannerTask[]) => PlannerTask[]) => {
    setTasks((currentTasks) => {
      const nextTasks = getNextTasks(currentTasks);
      savePlannerTasks(nextTasks);
      return nextTasks;
    });
  };

  const addTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    updateTasks((current) => [
      { title: taskTitle.trim(), due: formatDueDate(dueDate), dueDate, done: false },
      ...current,
    ]);
    setTaskTitle("");
    setDueDate("");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planner</h1>
        <p className="text-muted-foreground">Plan study blocks, deadlines, and daily review tasks.</p>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayTasks = tasks.filter((task) => task.dueDate === day.key);

              return (
                <div
                  key={day.key}
                  className={`min-h-32 rounded-lg border p-3 ${
                    day.isToday ? "border-primary bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground">{day.day}</p>
                  <p className="mt-1 text-lg font-semibold">{day.date}</p>
                  <div className="mt-4 space-y-1.5">
                    {dayTasks.length > 0 ? (
                      dayTasks.slice(0, 3).map((task) => (
                        <Badge
                          key={`${task.title}-${task.dueDate}`}
                          variant={task.done ? "secondary" : "default"}
                          className="block w-full truncate text-left"
                        >
                          {task.title}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No tasks</span>
                    )}
                    {dayTasks.length > 3 && (
                      <span className="block text-xs text-muted-foreground">+{dayTasks.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={addTask} className="grid gap-3 md:grid-cols-[1fr_12rem_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task</Label>
                <Input id="task-title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add a study task" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
              <Button type="submit" className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </form>
            <div className="space-y-3">
              {tasks.map((task) => (
                <button
                  key={`${task.title}-${task.due}`}
                  type="button"
                  onClick={() =>
                    updateTasks((current) =>
                      current.map((item) => item === task ? { ...item, done: !item.done } : item)
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/40"
                >
                  {task.done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                  <div className="flex-1">
                    <p className={task.done ? "font-medium text-muted-foreground line-through" : "font-medium"}>{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due {task.due}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
