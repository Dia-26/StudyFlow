"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Paperclip, BrainCircuit, Mic, Settings2, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStudyStore } from "@/store/useStudyStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type SpeechRecognitionResultItem = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: SpeechRecognitionResultItem;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResult;
  };
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function getSpeechErrorMessage(error: string) {
  const messages: Record<string, string> = {
    "not-allowed": "Microphone permission was blocked. Allow microphone access for this site and try again.",
    "audio-capture": "No microphone was found. Check your input device and try again.",
    "no-speech": "I did not hear anything. Try again and speak after the listening indicator appears.",
    network: "Speech recognition could not connect. Check your connection and try again.",
  };

  return messages[error] || `Speech recognition stopped: ${error}`;
}

export default function AITutorPage() {
  const { activeDocumentName, activeDocumentText } = useStudyStore();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello Alex! I'm your AI Study Tutor. You can attach a PDF below or ask me any question to get started. I can summarize topics, generate flashcards, or prepare you for an exam!",
    }
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [micStatus, setMicStatus] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptBaseRef = useRef("");
  const finalTranscriptRef = useRef("");

  // Initialize Native Browser Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const speechWindow = window as WindowWithSpeechRecognition;
      const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.maxAlternatives = 1;
        
        rec.onresult = (event) => {
          let finalTranscript = finalTranscriptRef.current;
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          finalTranscriptRef.current = finalTranscript;
          const spokenText = `${finalTranscript}${interimTranscript}`.trim();
          const prefix = transcriptBaseRef.current;

          if (spokenText) {
            setMicStatus("Listening... speech detected");
            setInput(prefix ? `${prefix} ${spokenText}` : spokenText);
          }
        };

        rec.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setMicStatus(getSpeechErrorMessage(event.error));
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
          if (!finalTranscriptRef.current.trim()) {
            setMicStatus((current) => current || "Listening stopped. No speech was captured.");
          }
        };

        setRecognition(rec);
      }
    }
  }, []);

  const requestMicrophonePermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicStatus("This browser cannot request microphone access.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error: unknown) {
      console.error("Microphone permission error", error);
      setMicStatus("Microphone permission was denied or no input device is available.");
      return false;
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !attachment && !isRecording) return;

    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
    }

    const userPrompt = input;
    const currentAttachment = attachment;
    
    let userContent = userPrompt;
    
    // Format message if there's an attachment
    if (currentAttachment) {
      userContent = `[Attached Document: ${currentAttachment.name}]\n${userPrompt}`;
    } else if (activeDocumentName) {
      userContent = `[Using Global Context: ${activeDocumentName}]\n${userPrompt}`;
    }

    // Add user message
    const newMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: userContent || "[Empty Message]" };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setAttachment(null);

    // Call real Gemini API
    try {
      const formData = new FormData();
      
      // If there's an active global document but no local attachment, inject its text into the prompt
      let finalPrompt = userPrompt || "Please analyze this document.";
      if (!currentAttachment && activeDocumentText) {
        finalPrompt = `[GLOBAL DOCUMENT CONTEXT: ${activeDocumentText.substring(0, 15000)}]\n\nUser Question: ${finalPrompt}`;
      }
      
      formData.append("prompt", finalPrompt);
      if (currentAttachment) {
        formData.append("file", currentAttachment);
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch response");
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text
      }]);
    } catch (err: unknown) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `**Error:** ${getErrorMessage(err)}. Make sure you have GROQ_API_KEY in your .env.local file.`
      }]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      try {
        recognition?.stop();
      } catch (e) {
        console.error(e);
      }
      setIsRecording(false);
    } else {
      if (recognition) {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) return;

        try {
          transcriptBaseRef.current = input.trim();
          finalTranscriptRef.current = "";
          setMicStatus("Listening... speak now");
          recognition.start();
          setIsRecording(true);
        } catch (e) {
          console.error(e);
          setMicStatus("Voice input is already starting. Please try again in a moment.");
        }
      } else {
        setMicStatus("This browser does not support speech-to-text. Please try Chrome or Edge.");
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto border border-border bg-card/50 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden relative">
      
      {/* Header */}
      <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground leading-none">StudyFlow AI Tutor</h2>
            <span className="text-xs text-muted-foreground">Using Native Speech Recognition • Exam Mode</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="hidden sm:flex rounded-full px-4 border-border">
          <Settings2 className="w-4 h-4 mr-2" />
          Tutor Settings
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/20 pb-32">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <Avatar className="w-8 h-8 shrink-0 mt-1 border border-border shadow-sm">
                {msg.role === "assistant" ? (
                  <div className="w-full h-full bg-primary flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>AL</AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed overflow-hidden ${
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/20 whitespace-pre-wrap" 
                  : "bg-card border border-border text-foreground rounded-tl-sm shadow-sm"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted/50 max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-xl border-t border-border shrink-0">
        
        {/* Attachment Preview */}
        <AnimatePresence>
          {attachment && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-3 flex items-center gap-2 bg-muted border border-border px-3 py-2 rounded-lg w-fit max-w-[80%]"
            >
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium truncate text-foreground">{attachment.name}</span>
              <span className="text-xs text-muted-foreground ml-2">({(attachment.size / 1024).toFixed(1)} KB)</span>
              <button onClick={() => setAttachment(null)} className="ml-2 text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {micStatus && (
          <p className={`mb-2 text-xs ${isRecording ? "text-destructive" : "text-muted-foreground"}`}>
            {micStatus}
          </p>
        )}

        <form onSubmit={handleSend} className={`flex items-end gap-2 bg-muted/50 rounded-2xl border p-2 transition-all ${isRecording ? 'border-destructive/50 ring-1 ring-destructive/50' : 'border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50'}`}>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          />
          
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 text-muted-foreground hover:text-primary rounded-full transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? "Listening to your voice... Speak now." : "Ask a question about your study materials..."} 
            className={`flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-2 h-10 resize-none ${isRecording ? 'placeholder:text-destructive animate-pulse' : ''}`}
          />

          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={toggleRecording}
            className={`shrink-0 rounded-full transition-all ${isRecording ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive' : 'text-muted-foreground hover:text-primary'}`}
          >
            {isRecording ? (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <Mic className="w-5 h-5" />
              </motion.div>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          <Button 
            type="submit" 
            size="icon" 
            disabled={(!input.trim() && !attachment && !isRecording)}
            className="shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-transform active:scale-95"
          >
            <Send className="w-4 h-4" />
          </Button>

        </form>
      </div>
    </div>
  );
}
