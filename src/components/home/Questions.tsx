import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, Timer, ArrowRight, RotateCcw, Home } from "lucide-react";

// Shadcn UI Components
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// --- Types ---
interface Question {
  id: number;
  topic: string;
  time: string;
  score: number;
  question: string;
  choices: { [key: string]: string };
  correctAns: string;
}

// --- Hardcoded Data ---
const quizData: Question[] = [
  {
    id: 1,
    topic: "Permutation",
    time: "10:00",
    score: 10,
    question: "Which of the following describes a Permutation?",
    choices: { a: "Selection order matters", b: "Selection order doesn't matter", c: "Grouping objects", d: "None of the above" },
    correctAns: 'a',
  },
  {
    id: 2,
    topic: "Permutation",
    time: "10:00",
    score: 10,
    question: "Calculate P(5, 2)",
    choices: { a: "10", b: "20", c: "60", d: "120" },
    correctAns: 'b',
  },
  {
    id: 3,
    topic: "Combination",
    time: "10:00",
    score: 10,
    question: "Which formula represents a Combination?",
    choices: { a: "n! / (n-r)!", b: "n! / r!(n-r)!", c: "n * r", d: "n + r" },
    correctAns: 'b',
  },
];

// --- Sub-component: Results Screen ---
const QuizResult = ({ score, total, onRetry }: { score: number, total: number, onRetry: () => void }) => {
  const percentage = Math.round((score / total) * 100);

  return (
    <Card className="w-full max-w-md mx-auto mt-10 text-center animate-in zoom-in-50 duration-500 shadow-2xl border-none bg-card">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary">Quiz Completed!</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center w-48 h-48">
            <svg className="transform -rotate-90 w-full h-full">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    strokeDasharray={552} 
                    strokeDashoffset={552 - (552 * percentage) / 100} 
                    className="text-primary transition-all duration-1000 ease-out" 
                />
            </svg>
            <div className="absolute text-4xl font-extrabold text-foreground">{percentage}%</div>
        </div>
        <p className="text-muted-foreground text-lg">You scored <span className="text-foreground font-bold">{score}</span> out of {total}</p>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Button onClick={onRetry} variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
            <RotateCcw className="w-4 h-4" /> Retry
        </Button>
        <Button asChild className="gap-2">
            <Link to="/user"><Home className="w-4 h-4" /> Dashboard</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// --- Main Component ---
export default function Questions() {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAns, setSelectedAns] = useState<string>("");
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = quizData[currentQIndex];
  const progress = ((currentQIndex) / quizData.length) * 100;

  useEffect(() => {
    setSelectedAns("");
  }, [currentQIndex]);

  const handleNext = () => {
    if (selectedAns === currentQuestion.correctAns) {
      setScore(prev => prev + 1);
    }

    if (currentQIndex < quizData.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRetry = () => {
    setScore(0);
    setCurrentQIndex(0);
    setQuizFinished(false);
  };

  if (quizFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <QuizResult score={score} total={quizData.length} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      {/* 1. Header: Progress & Timer (Replaces custom header styling) */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between gap-6">
        <div className="flex flex-col w-full gap-3">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Question {currentQIndex + 1} of {quizData.length}</span>
                <span className="text-primary">{currentQuestion.topic}</span>
            </div>
            <Progress value={progress} className="h-2 bg-secondary" />
        </div>
        <div className="flex items-center gap-2 text-primary font-mono bg-primary/10 border border-primary/20 px-4 py-2 rounded-full shadow-sm">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-bold">{currentQuestion.time}</span>
        </div>
      </div>

      {/* 2. Question Card (Replaces .questionContainer) */}
      <Card className="w-full max-w-2xl shadow-2xl border-none bg-card overflow-hidden">
        <div className="h-2 w-full bg-primary" /> {/* Top accent bar */}
        <CardHeader className="pt-8 pb-4">
          <CardTitle className="text-2xl md:text-3xl font-bold leading-tight text-center md:text-left">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pb-8">
          <RadioGroup 
            onValueChange={setSelectedAns} 
            value={selectedAns} 
            className="flex flex-col gap-4"
          >
            {Object.entries(currentQuestion.choices).map(([key, value]) => (
              <div 
                key={key} 
                className={`flex items-center space-x-3 border-2 rounded-xl p-5 transition-all cursor-pointer hover:bg-secondary/50 group ${
                  selectedAns === key ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                }`}
                onClick={() => setSelectedAns(key)}
              >
                <RadioGroupItem value={key} id={`choice-${key}`} className="sr-only" />
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-bold uppercase transition-colors ${
                  selectedAns === key ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground text-muted-foreground group-hover:border-primary group-hover:text-primary"
                }`}>
                  {key}
                </div>
                <Label htmlFor={`choice-${key}`} className="flex-grow cursor-pointer font-medium text-lg">
                    {value}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>

        <Separator className="opacity-50" />

        <CardFooter className="flex justify-between items-center p-6 bg-muted/20">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Current Score: {score}
            </div>
            <Button 
                onClick={handleNext} 
                disabled={!selectedAns}
                className="w-40 h-12 text-lg gap-2 shadow-lg shadow-primary/20"
            >
                {currentQIndex < quizData.length - 1 ? "Next Question" : "Finish Quiz"} 
                <ArrowRight className="w-5 h-5" />
            </Button>
        </CardFooter>
      </Card>

      <p className="mt-8 text-muted-foreground text-sm font-medium animate-pulse">
        Choose the best answer to proceed.
      </p>
    </div>
  );
}