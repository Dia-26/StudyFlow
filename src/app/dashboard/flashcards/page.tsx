"use client";

import { useState } from "react";
import { useStudyStore } from "@/store/useStudyStore";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BrainCircuit, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

export default function FlashcardsPage() {
  const { activeDocumentName, activeDocumentText } = useStudyStore();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [iteration, setIteration] = useState(1);

  const handleGenerate = async () => {
    if (!activeDocumentText) return;
    setIsLoading(true);
    setFlashcards([]);
    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextText: activeDocumentText, deckNumber: iteration }),
      });
      if (!response.ok) throw new Error("Failed to generate flashcards");
      const data = await response.json();
      setFlashcards(data.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIteration(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert("Failed to generate flashcards. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(c => c + 1), 150);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(c => c - 1), 150);
    }
  };

  if (!activeDocumentText) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <BrainCircuit className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No Active Document</h2>
        <p className="text-muted-foreground max-w-md text-center">
          Please upload a PDF on the main dashboard first. We will use that document to generate your smart flashcards!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-[calc(100vh-8rem)] max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Flashcards</h1>
        <p className="text-muted-foreground">
          Context: <span className="font-medium text-foreground">{activeDocumentName}</span> {iteration > 1 && <span className="text-primary font-medium ml-2">(Set {iteration - 1})</span>}
        </p>
      </div>

      {flashcards.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 w-full border border-border bg-card/50 backdrop-blur-xl rounded-2xl shadow-sm">
          <BrainCircuit className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-lg font-medium mb-4">{iteration > 1 ? "Ready for completely new topics?" : "Ready to test your knowledge?"}</h2>
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading}
            className="rounded-full px-8 py-6 text-md shadow-lg hover:shadow-primary/25 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Document...
              </>
            ) : (
              iteration > 1 ? "Generate Next Topic Set" : "Generate 10 Flashcards"
            )}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-2xl">
          {/* Progress Bar */}
          <div className="w-full bg-secondary h-2 rounded-full mb-8 overflow-hidden">
            <motion.div 
              className="bg-primary h-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>

          {/* Flashcard 3D Wrapper */}
          <div className="relative w-full aspect-[3/2] perspective-[1000px] mb-8 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div
              className="w-full h-full relative preserve-3d"
              animate={{ rotateX: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
              {/* Front */}
              <div className="absolute w-full h-full backface-hidden bg-card border-2 border-border rounded-3xl shadow-xl flex items-center justify-center p-8 text-center hover:border-primary/50 transition-colors">
                <div className="absolute top-4 left-6 text-sm font-semibold text-primary/80 uppercase tracking-wider">Question</div>
                <h3 className="text-2xl font-medium leading-relaxed">{flashcards[currentIndex].front}</h3>
                <div className="absolute bottom-4 right-6 text-sm text-muted-foreground">Click to flip</div>
              </div>

              {/* Back */}
              <div className="absolute w-full h-full backface-hidden bg-primary text-primary-foreground rounded-3xl shadow-xl flex items-center justify-center p-8 text-center" style={{ transform: "rotateX(180deg)" }}>
                <div className="absolute top-4 left-6 text-sm font-semibold text-primary-foreground/80 uppercase tracking-wider">Answer</div>
                <p className="text-xl leading-relaxed">{flashcards[currentIndex].back}</p>
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 w-full justify-between">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={prevCard} 
              disabled={currentIndex === 0}
              className="w-12 h-12 rounded-full border-2 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {currentIndex === flashcards.length - 1 ? (
              <Button onClick={() => setFlashcards([])} className="rounded-full px-8 animate-in fade-in zoom-in duration-300">
                Generate Next Set <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <span className="text-sm font-medium text-muted-foreground w-16 text-center">
                {currentIndex + 1} / {flashcards.length}
              </span>
            )}

            <Button 
              variant="outline" 
              size="icon" 
              onClick={nextCard} 
              disabled={currentIndex === flashcards.length - 1}
              className={`w-12 h-12 rounded-full border-2 shrink-0 ${currentIndex === flashcards.length - 1 ? 'opacity-0 pointer-events-none' : ''}`}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
