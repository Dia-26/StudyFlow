"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = searchParams.get("next") || "/dashboard";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Authentication failed.");

      router.push(nextPath);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Back to home button */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 hover:bg-background border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all duration-200 z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to home</span>
      </Link>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6 hover:opacity-80 transition">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
              <BookOpen className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              StudyFlow
            </span>
          </Link>
          
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {mode === "login" ? "Welcome back" : "Get started"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {mode === "login" 
              ? "Sign in to access your study dashboard" 
              : "Create an account to organize your learning"}
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            {/* Tab Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-8 bg-muted/40 p-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  mode === "login" 
                    ? "bg-background shadow-md text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  mode === "signup" 
                    ? "bg-background shadow-md text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-5">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(event) => setName(event.target.value)} 
                      placeholder="John Doe" 
                      className="pl-10 py-2.5 bg-muted/40 border-border hover:bg-muted/60 focus:bg-background transition-colors"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(event) => setEmail(event.target.value)} 
                    placeholder="you@example.com" 
                    className="pl-10 py-2.5 bg-muted/40 border-border hover:bg-muted/60 focus:bg-background transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(event) => setPassword(event.target.value)} 
                    placeholder={mode === "login" ? "Enter your password" : "Create a strong password"} 
                    className="pl-10 py-2.5 bg-muted/40 border-border hover:bg-muted/60 focus:bg-background transition-colors"
                  />
                </div>
                {mode === "signup" && (
                  <p className="text-xs text-muted-foreground pt-1">At least 6 characters. Use a mix of letters, numbers, and symbols.</p>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full gap-2 py-2.5 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 transition-all duration-200"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Sign in" : "Create account"}
              </Button>

              {mode === "login" && (
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-semibold text-primary hover:text-primary/80 transition"
                  >
                    Sign up
                  </button>
                </p>
              )}

              {mode === "signup" && (
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-semibold text-primary hover:text-primary/80 transition"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By {mode === "login" ? "signing in" : "creating an account"}, you agree to our{" "}
          <Link href="#" className="hover:text-foreground transition">
            Terms
          </Link>
          {" "}and{" "}
          <Link href="#" className="hover:text-foreground transition">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30" />}>
      <AuthForm />
    </Suspense>
  );
}
