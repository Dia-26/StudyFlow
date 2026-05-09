"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, BrainCircuit, CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { recordFocusSeconds } from "@/lib/study-analytics";

type Mode = "focus" | "shortBreak" | "longBreak";

const MODES = {
  focus: { label: "Focus", minutes: 25, color: "text-primary" },
  shortBreak: { label: "Short Break", minutes: 5, color: "text-green-500" },
  longBreak: { label: "Long Break", minutes: 15, color: "text-blue-500" },
};

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export default function PomodoroPage() {
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Review Chapter 4 Summary", completed: false },
    { id: "2", title: "Complete AI Quiz", completed: true },
  ]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          setIsActive(false);
          if (mode === "focus") {
            recordFocusSeconds(1);
          }
          return 0;
        }

        if (mode === "focus") {
          recordFocusSeconds(1);
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, mode]);

  useEffect(() => {
    if (timeLeft !== 0) return;

    const audio = new Audio("https://cdn.freesound.org/previews/411/411088_5121236-lq.mp3");
    audio.play().catch(() => {});
  }, [timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), title: newTask, completed: false }]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const progress = ((MODES[mode].minutes * 60 - timeLeft) / (MODES[mode].minutes * 60)) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] max-w-5xl mx-auto py-8 px-4">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: Timer */}
        <div className="flex flex-col items-center p-8 bg-card border border-border rounded-3xl shadow-sm">
          {/* Mode Selector */}
          <div className="flex items-center gap-2 bg-muted p-1.5 rounded-full mb-12 w-full max-w-sm">
            {(Object.keys(MODES) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  "flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all",
                  mode === m 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {MODES[m].label}
              </button>
            ))}
          </div>

          {/* Circular Timer Display */}
          <div className="relative flex items-center justify-center w-72 h-72 mb-12">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-muted fill-none"
                strokeWidth="4"
              />
              {/* Progress Circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                className={cn("fill-none", MODES[mode].color, mode === 'focus' ? 'stroke-primary' : mode === 'shortBreak' ? 'stroke-green-500' : 'stroke-blue-500')}
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ strokeDasharray: "283", strokeDashoffset: "283" }}
                animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-6xl font-bold tracking-tighter text-foreground">
                {formatTime(timeLeft)}
              </span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-2">
                {mode === "focus" ? "Stay Focused" : "Take a Break"}
              </span>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={resetTimer}
              className="w-14 h-14 rounded-full border-2 hover:bg-muted"
            >
              <RotateCcw className="w-6 h-6 text-muted-foreground" />
            </Button>
            
            <Button
              size="icon"
              onClick={toggleTimer}
              className={cn(
                "w-20 h-20 rounded-full shadow-lg transition-transform active:scale-95",
                mode === "focus" ? "bg-primary hover:bg-primary/90 text-primary-foreground" : 
                mode === "shortBreak" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
              )}
            >
              {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const nextMode = mode === "focus" ? "shortBreak" : "focus";
                switchMode(nextMode);
              }}
              className="w-14 h-14 rounded-full border-2 hover:bg-muted"
            >
              {mode === "focus" ? (
                <Coffee className="w-6 h-6 text-muted-foreground" />
              ) : (
                <BrainCircuit className="w-6 h-6 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Task List */}
        <div className="flex flex-col h-full bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-xl font-bold">Focus Tasks</h2>
            <p className="text-sm text-muted-foreground">What are you working on?</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <AnimatePresence>
              {tasks.map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "group flex items-center justify-between p-4 rounded-2xl border transition-all",
                    task.completed ? "bg-muted/50 border-transparent" : "bg-background border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleTask(task.id)}>
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground shrink-0" />
                    )}
                    <span className={cn(
                      "text-base transition-colors",
                      task.completed ? "text-muted-foreground line-through" : "text-foreground font-medium"
                    )}>
                      {task.title}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="p-6 border-t border-border bg-muted/30">
            <form onSubmit={addTask} className="flex items-center gap-2">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 bg-background border-border rounded-xl h-12 px-4"
              />
              <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shrink-0">
                <Plus className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
