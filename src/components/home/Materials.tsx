import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Trophy, PlayCircle } from "lucide-react";

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// 1. Define Data Types
interface LessonData {
  id: number;
  lesson_title: string;
  topic: string;
  progress_val: number;
  time: string;
}

// Dummy Data
const lessons: LessonData[] = [
  { id: 1, lesson_title: 'Lesson 1', topic: 'Introduction to Logic', progress_val: 75, time: '10:00' },
  { id: 2, lesson_title: 'Lesson 2', topic: 'Advanced Permutation', progress_val: 40, time: '15:00' },
  { id: 3, lesson_title: 'Lesson 3', topic: 'Combinations', progress_val: 0, time: '12:00' },
  { id: 4, lesson_title: 'Lesson 4', topic: 'Probability Theory', progress_val: 10, time: '20:00' },
];

// 2. Sub-component for the Quiz Action
const QuizAction = ({ time }: { time: string }) => {
  const [showScore, setShowScore] = useState(false);

  if (showScore) {
    return (
      <Card className="w-full bg-emerald-600 text-white border-none animate-in fade-in zoom-in duration-300">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-300" />
            <span className="font-bold">Score: 8/10</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowScore(false)} 
            className="text-white hover:bg-emerald-700"
          >
            Retake
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="w-full cursor-pointer hover:bg-accent/50 transition-all border-dashed group"
      onClick={() => setShowScore(true)}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Quiz: {time}</span>
        </div>
        <Link to="/choices" onClick={(e : React.MouseEvent) => e.stopPropagation()}>
            <Button size="sm" className="gap-2 shadow-md">
                <PlayCircle className="h-4 w-4" /> Start
            </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

// 3. Main Component
export default function Materials() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 md:p-12 text-foreground">
      {/* Header Section */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-12">
        <Button variant="outline" size="icon" asChild className="rounded-full h-12 w-12 border-border hover:bg-secondary">
          <Link to="/user">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary">Study Materials</h1>
            <p className="text-muted-foreground mt-2">Master your modules at your own pace</p>
        </div>
        <div className="w-12" /> {/* Spacer for symmetry */}
      </div>

      {/* Lesson Carousel (Replaces custom swiper and .materials-user) */}
      <div className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-12">
        <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent className="-ml-4">
            {lessons.map((lesson) => (
                <CarouselItem key={lesson.id} className="pl-4 md:basis-1/2 lg:basis-1/2">
                <Card className="h-[500px] flex flex-col border-none shadow-xl bg-card hover:ring-2 hover:ring-primary/20 transition-all overflow-hidden group">
                    <div className="h-2 w-full bg-muted group-hover:bg-primary transition-colors" />
                    
                    <CardHeader className="space-y-1 pt-8">
                    <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="mb-2 uppercase tracking-widest text-[10px]">{lesson.lesson_title}</Badge>
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-bold leading-tight">{lesson.topic}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="flex-1 space-y-8">
                    {/* Integrated Shadcn Progress Component */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                            <span>Module Progress</span>
                            <span className="text-primary">{lesson.progress_val}%</span>
                        </div>
                        <Progress value={lesson.progress_val} className="h-2.5 bg-secondary" />
                    </div>
                    
                    <CardDescription className="text-sm leading-relaxed">
                        Deep dive into the core principles of {lesson.topic.toLowerCase()}. 
                        This interactive module includes instructional videos, practice sets, and a final assessment.
                    </CardDescription>
                    </CardContent>

                    <CardFooter className="pb-8">
                        <QuizAction time={lesson.time} />
                    </CardFooter>
                </Card>
                </CarouselItem>
            ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 h-12 w-12" />
            <CarouselNext className="hidden md:flex -right-12 h-12 w-12" />
        </Carousel>
      </div>

      <footer className="mt-16 text-center space-y-2">
        <p className="text-muted-foreground text-sm font-medium">
          Swipe or use arrows to explore different lessons
        </p>
        <div className="flex justify-center gap-1.5">
            {lessons.map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-muted" />
            ))}
        </div>
      </footer>
    </div>
  );
}