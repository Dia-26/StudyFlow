"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { FileText, Pencil, Plus, Save, Search, Star, Trash2, X } from "lucide-react";
import { ANALYTICS_UPDATED_EVENT, readStudyNotes, saveStudyNotes, type StudyNote } from "@/lib/study-analytics";

const initialNotes: StudyNote[] = [
  {
    id: "limits",
    title: "Limits and continuity",
    subject: "Calculus",
    updatedAt: new Date().toISOString(),
    body: "Key idea: a function can approach a value even when it is not defined at that point.",
    starred: true,
  },
];

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function NotesPage() {
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<StudyNote[]>(() => readStudyNotes(initialNotes));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    const syncNotes = () => setNotes(readStudyNotes(initialNotes));

    window.addEventListener(ANALYTICS_UPDATED_EVENT, syncNotes);
    return () => window.removeEventListener(ANALYTICS_UPDATED_EVENT, syncNotes);
  }, []);

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) =>
        [note.title, note.subject, note.body].some((value) =>
          value.toLowerCase().includes(query.toLowerCase())
        )
      ),
    [notes, query]
  );

  const updateNotes = (getNextNotes: (currentNotes: StudyNote[]) => StudyNote[]) => {
    setNotes((currentNotes) => {
      const nextNotes = getNextNotes(currentNotes);
      saveStudyNotes(nextNotes);
      return nextNotes;
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSubject("");
    setBody("");
    setStarred(false);
  };

  const startEdit = (note: StudyNote) => {
    setEditingId(note.id);
    setTitle(note.title);
    setSubject(note.subject);
    setBody(note.body);
    setStarred(note.starred);
  };

  const saveNote = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() && !body.trim()) return;

    const note: StudyNote = {
      id: editingId || crypto.randomUUID(),
      title: title.trim() || "Untitled note",
      subject: subject.trim() || "General",
      body: body.trim() || "No note content yet.",
      starred,
      updatedAt: new Date().toISOString(),
    };

    updateNotes((currentNotes) => {
      if (editingId) {
        return currentNotes.map((currentNote) => currentNote.id === editingId ? note : currentNote);
      }

      return [note, ...currentNotes];
    });
    resetForm();
  };

  const deleteNote = (id: string) => {
    updateNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));
    if (editingId === id) resetForm();
  };

  const toggleStar = (id: string) => {
    updateNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === id ? { ...note, starred: !note.starred, updatedAt: new Date().toISOString() } : note
      )
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground">Create, edit, search, and save your study notes.</p>
        </div>
        <Button onClick={resetForm} className="gap-2">
          <Plus className="w-4 h-4" />
          New note
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-5">
          <form onSubmit={saveNote} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_12rem_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Newton's laws summary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-subject">Subject</Label>
                <Input
                  id="note-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Physics"
                />
              </div>
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                {editingId ? "Update" : "Save"}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-body">Note</Label>
              <textarea
                id="note-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write formulas, summaries, questions, links, or anything you want to remember..."
                className="min-h-40 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStarred((current) => !current)}
                className="flex w-fit items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Star className={`h-4 w-4 ${starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                {starred ? "Starred" : "Mark important"}
              </button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search saved notes"
          className="h-11 pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="secondary">{note.subject}</Badge>
                <CardTitle className="text-lg break-words">{note.title}</CardTitle>
              </div>
              <button type="button" onClick={() => toggleStar(note.id)} className="shrink-0">
                {note.starred ? <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{note.body}</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">Updated {formatUpdatedAt(note.updatedAt)}</p>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => startEdit(note)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => deleteNote(note.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
