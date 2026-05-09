"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, Sun, BookOpen, Brain, Clock, Zap } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Animated Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              StudyFlow
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Features
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full bg-transparent border-border"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link href="/auth">
              <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-transform hover:scale-105">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            <span>Next-Generation AI Learning Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            Study Smarter with <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              AI-Powered Learning
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload your lecture notes, readings, or PDFs. We automatically extract key concepts, create flashcards, and generate quizzes so you learn faster and retain more.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth?next=/dashboard">
              <Button size="lg" className="rounded-full px-8 h-14 text-lg font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                Start Studying Free
              </Button>
            </Link>
            <Link href="/auth?next=/dashboard">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg font-medium border-border hover:bg-muted transition-all">
                View Demo
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Floating Feature Cards Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {[
            {
              icon: <Brain className="w-6 h-6 text-primary" />,
              title: "Smart Flashcards",
              desc: "AI automatically generates spaced-repetition flashcards from your notes."
            },
            {
              icon: <BookOpen className="w-6 h-6 text-secondary" />,
              title: "Document Analysis",
              desc: "Upload PDFs and let AI summarize, explain, and extract the core concepts."
            },
            {
              icon: <Clock className="w-6 h-6 text-accent" />,
              title: "Focus Sessions",
              desc: "Integrated Pomodoro timer with productivity analytics and study streaks."
            }
          ].map((feature, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur-md border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6 border border-border/50">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
