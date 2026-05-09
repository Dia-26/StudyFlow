"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function DashboardTopbar() {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
    router.refresh();
  };

  return (
    <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
      <div className="flex items-center bg-muted/50 rounded-lg px-3 py-1.5 w-full max-w-md border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
        <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
        <Input 
          type="text" 
          placeholder="Search notes, flashcards, or ask AI..." 
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-8 text-sm"
        />
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full">
          <Bell className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full text-muted-foreground"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <div className="h-8 w-px bg-border mx-2" />
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium leading-none">{user?.name || "Student"}</p>
          <p className="text-xs text-muted-foreground mt-1">{user?.email || "Mongo synced"}</p>
        </div>
        <Avatar className="h-9 w-9 border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || "ST"}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground rounded-full">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
