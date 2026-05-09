"use client";

import { useState } from "react";
import { useStudyStore } from "@/store/useStudyStore";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Loader2, CheckCircle2, XCircle, ArrowRight, Award } from "lucide-react";
import { recordQuizResult } from "@/lib/study-analytics";

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

type ButtonVariant = "default" | "outline" | "destructive";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to generate quiz. Please try again.";
}

export default function QuizPage() {
  const { activeDocumentName, activeDocumentText } = useStudyStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [iteration, setIteration] = useState(1);

  const handleGenerate = async () => {
    if (!activeDocumentText) return;
    setIsLoading(true);
    setQuestions([]);
    setScore(0);
    setIsFinished(false);
    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextText: activeDocumentText, quizNumber: iteration }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate quiz");
      setQuestions(data.questions);
      setCurrentIndex(0);
      setIsAnswered(false);
      setSelectedOption(null);
      setIteration(prev => prev + 1);
    } catch (error: unknown) {
      console.error(error);
      alert(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentIndex].answer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      recordQuizResult(score, questions.length);
      setIsFinished(true);
    }
  };

  if (!activeDocumentText) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <BrainCircuit className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No Active Document</h2>
        <p className="text-muted-foreground max-w-md text-center">
          Please upload a PDF on the main dashboard first. We will use that document to generate your exam quiz!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-8rem)] max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Exam Simulator</h1>
        <p className="text-muted-foreground">
          Context: <span className="font-medium text-foreground">{activeDocumentName}</span> {iteration > 1 && <span className="text-primary font-medium ml-2">(Set {iteration - 1})</span>}
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 w-full border border-border bg-card/50 backdrop-blur-xl rounded-2xl shadow-sm py-16">
          <BrainCircuit className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-lg font-medium mb-4">{iteration > 1 ? "Ready for completely new exam topics?" : "Ready to simulate an exam?"}</h2>
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading}
            className="rounded-full px-8 py-6 text-md shadow-lg hover:shadow-primary/25 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Exam...
              </>
            ) : (
              iteration > 1 ? "Generate Next Topic Exam" : "Generate 5-Question Quiz"
            )}
          </Button>
        </div>
      ) : isFinished ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center w-full max-w-2xl border border-border bg-card p-12 rounded-3xl shadow-xl"
        >
          <Award className="w-20 h-20 text-yellow-500 mb-6" />
          <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-xl text-muted-foreground mb-8">
            You scored <span className="font-bold text-primary">{score}</span> out of {questions.length}
          </p>
          <Button onClick={handleGenerate} className="rounded-full px-8">
            Take Another Exam (New Topics)
          </Button>
        </motion.div>
      ) : (
        <div className="w-full max-w-3xl flex flex-col items-center">
          {/* Progress Bar */}
          <div className="w-full bg-secondary h-2 rounded-full mb-8 overflow-hidden">
            <motion.div 
              className="bg-primary h-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full border border-border bg-card rounded-3xl shadow-xl p-8 md:p-10"
            >
              <div className="mb-8">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 block">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <h3 className="text-2xl font-medium leading-relaxed">{questions[currentIndex].question}</h3>
              </div>

              <div className="space-y-3 mb-8">
                {questions[currentIndex].options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === questions[currentIndex].answer;
                  
                  let buttonVariant: ButtonVariant = "outline";
                  if (isAnswered) {
                    if (isCorrect) buttonVariant = "default";
                    else if (isSelected && !isCorrect) buttonVariant = "destructive";
                  }

                  return (
                    <Button
                      key={idx}
                      variant={buttonVariant}
                      className={`w-full justify-start h-auto py-4 px-6 text-left whitespace-normal rounded-2xl border-2 ${
                        !isAnswered ? "hover:border-primary/50 hover:bg-secondary/50" : ""
                      } ${isAnswered && isCorrect ? "bg-green-500 hover:bg-green-600 border-green-500 text-white" : ""}
                        ${isAnswered && isSelected && !isCorrect ? "border-destructive text-white" : ""}
                      `}
                      onClick={() => handleOptionSelect(option)}
                    >
                      <div className="flex items-center w-full">
                        <span className="flex-1 text-base">{option}</span>
                        {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 ml-2 shrink-0" />}
                        {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 ml-2 shrink-0" />}
                      </div>
                    </Button>
                  );
                })}
              </div>

              <AnimatePresence>
                {isAnswered && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-muted/50 rounded-2xl border border-border text-sm leading-relaxed mb-6 text-muted-foreground">
                      <strong className="text-foreground block mb-1">Explanation:</strong>
                      {questions[currentIndex].explanation}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end">
                <Button 
                  onClick={handleNext} 
                  disabled={!isAnswered}
                  className="rounded-full px-6"
                >
                  {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
