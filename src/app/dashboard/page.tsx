"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, BookOpen, Clock, Loader2, Play, Plus, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStudyStore } from "@/store/useStudyStore";
import {
  ANALYTICS_UPDATED_EVENT,
  readFocusLogs,
  readPlannerTasks,
  readQuizResults,
  readStudySubjects,
  saveStudySubjects,
  type StudySubject,
} from "@/lib/study-analytics";

const initialSubjects: StudySubject[] = [
  {
    id: "calculus",
    name: "Advanced Calculus",
    progress: 78,
    timeSpent: "12 hrs",
    notes: "Limits, derivatives, and integration practice.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "chemistry",
    name: "Organic Chemistry",
    progress: 45,
    timeSpent: "8 hrs",
    notes: "Reaction mechanisms and nomenclature.",
    updatedAt: new Date().toISOString(),
  },
];

export default function Dashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [subjects, setSubjects] = useState<StudySubject[]>(() => readStudySubjects(initialSubjects));
  const [subjectName, setSubjectName] = useState("");
  const [subjectProgress, setSubjectProgress] = useState("0");
  const [subjectTime, setSubjectTime] = useState("");
  const [subjectNotes, setSubjectNotes] = useState("");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [studyPlan, setStudyPlan] = useState<{
    summary: string;
    priorities: string[];
    focusPlan: string;
    source: "ai" | "fallback";
  } | null>(null);

  const { setActiveDocument } = useStudyStore();

  useEffect(() => {
    const syncSubjects = () => setSubjects(readStudySubjects(initialSubjects));

    window.addEventListener(ANALYTICS_UPDATED_EVENT, syncSubjects);
    return () => window.removeEventListener(ANALYTICS_UPDATED_EVENT, syncSubjects);
  }, []);

  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setUserName(data?.user?.name ?? null);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      mounted = false;
    };
  }, []);

  const updateSubjects = (getNextSubjects: (currentSubjects: StudySubject[]) => StudySubject[]) => {
    setSubjects((currentSubjects) => {
      const nextSubjects = getNextSubjects(currentSubjects);
      saveStudySubjects(nextSubjects);
      return nextSubjects;
    });
  };

  const addSubject = (event: React.FormEvent) => {
    event.preventDefault();
    if (!subjectName.trim()) return;

    const progress = Math.min(100, Math.max(0, Number(subjectProgress) || 0));
    updateSubjects((currentSubjects) => [
      {
        id: crypto.randomUUID(),
        name: subjectName.trim(),
        progress,
        timeSpent: subjectTime.trim() || "0 hrs",
        notes: subjectNotes.trim() || "No notes added.",
        updatedAt: new Date().toISOString(),
      },
      ...currentSubjects,
    ]);
    setSubjectName("");
    setSubjectProgress("0");
    setSubjectTime("");
    setSubjectNotes("");
  };

  const deleteSubject = (id: string) => {
    updateSubjects((currentSubjects) => currentSubjects.filter((subject) => subject.id !== id));
  };

  const generateStudyPlan = async () => {
    setIsGeneratingPlan(true);

    try {
      const response = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          plannerTasks: readPlannerTasks(),
          quizResults: readQuizResults(),
          focusLogs: readFocusLogs(),
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to generate study plan");
      setStudyPlan(data);
    } catch {
      setStudyPlan({
        summary: "I could not reach the AI coach, but your saved subjects are still ready for review.",
        priorities: [
          subjects[0] ? `Study ${subjects[0].name} for 25 minutes.` : "Add a subject you want to study.",
          "Add one planner task with a due date.",
          "Finish a quiz to unlock performance-based suggestions.",
        ],
        focusPlan: "Start with one Pomodoro focus session and check Analytics afterward.",
        source: "fallback",
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        setActiveDocument(data.name, data.text);

        alert(`Successfully uploaded "${data.name}"! It is now set as your active global context.`);
      } catch {
        alert("Failed to parse document. Are you sure it's a PDF?");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-8 rounded-2xl shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

        <div className="z-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {userName ? `Welcome back, ${userName}!` : "Welcome back!"}
          </h1>
          <p className="text-muted-foreground">
            You have {subjects.length} saved subject{subjects.length === 1 ? "" : "s"} in your study dashboard.
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="z-10 bg-primary hover:bg-primary/90 rounded-full px-6 shadow-md shadow-primary/20 transition-all hover:scale-105"
        >
          <UploadCloud className={`w-4 h-4 mr-2 ${isUploading ? "animate-bounce" : ""}`} />
          {isUploading ? "Uploading..." : "Upload New Material"}
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="hover:border-primary/50 transition-colors cursor-pointer group shadow-sm">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Start AI Tutor</h3>
            <p className="text-sm text-muted-foreground">Have a conversation about your recent notes.</p>
          </CardContent>
        </Card>

        <Card className="hover:border-secondary/50 transition-colors cursor-pointer group shadow-sm">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-semibold mb-1">Review Flashcards</h3>
            <p className="text-sm text-muted-foreground">Generate review cards from your active material.</p>
          </CardContent>
        </Card>

        <Card className="hover:border-accent/50 transition-colors cursor-pointer group shadow-sm">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold mb-1">Focus Session</h3>
            <p className="text-sm text-muted-foreground">Start a Pomodoro timer and track study time.</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="shadow-sm border-primary/20">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold tracking-tight">Smart Study Coach</h2>
                  {studyPlan && <Badge variant="secondary">{studyPlan.source === "ai" ? "AI generated" : "Local fallback"}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generates a plan from your saved subjects, planner tasks, quiz scores, and focus history.
                </p>
              </div>
              <Button onClick={generateStudyPlan} disabled={isGeneratingPlan} className="gap-2">
                {isGeneratingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGeneratingPlan ? "Thinking..." : "Generate plan"}
              </Button>
            </div>

            {studyPlan ? (
              <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm font-medium">Coach summary</p>
                  <p className="mt-2 text-sm text-muted-foreground">{studyPlan.summary}</p>
                  <p className="mt-4 text-sm font-medium">Focus plan</p>
                  <p className="mt-2 text-sm text-muted-foreground">{studyPlan.focusPlan}</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm font-medium">Next best actions</p>
                  <div className="mt-3 space-y-2">
                    {studyPlan.priorities.map((priority, index) => (
                      <div key={priority} className="flex gap-3 rounded-md bg-muted/50 p-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground">{priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                Add a few subjects or tasks, then generate a plan to get personalized recommendations.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Subjects</h2>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <form onSubmit={addSubject} className="grid gap-4 lg:grid-cols-[1fr_8rem_8rem_auto] lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="subject-name">Subject</Label>
                <Input
                  id="subject-name"
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  placeholder="Physics, Biology, Data Structures..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject-progress">Progress</Label>
                <Input
                  id="subject-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={subjectProgress}
                  onChange={(event) => setSubjectProgress(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject-time">Time</Label>
                <Input
                  id="subject-time"
                  value={subjectTime}
                  onChange={(event) => setSubjectTime(event.target.value)}
                  placeholder="3 hrs"
                />
              </div>
              <Button type="submit" className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
              <div className="space-y-2 lg:col-span-4">
                <Label htmlFor="subject-notes">Notes</Label>
                <Input
                  id="subject-notes"
                  value={subjectNotes}
                  onChange={(event) => setSubjectNotes(event.target.value)}
                  placeholder="Store goals, chapters, deadlines, or anything you want to remember"
                />
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjects.map((subject) => (
            <Card key={subject.id} className="shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-5 border-b border-border">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base break-words">{subject.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground break-words">{subject.notes}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md text-foreground">{subject.timeSpent}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteSubject(subject.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Course Mastery</span>
                      <span>{subject.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-primary/20">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${subject.progress}%` }} />
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 p-3 px-5 flex justify-between items-center hover:bg-muted/50 cursor-pointer transition-colors group">
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Continue Studying</span>
                  <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
