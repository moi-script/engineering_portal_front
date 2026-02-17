import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, PlusCircle, Save, FilePlus, ListChecks } from "lucide-react";

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function UploadQuiz() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8 flex flex-col items-center">
      {/* Page Header */}
      <div className="w-full max-w-5xl flex justify-between items-center">
        <Button variant="outline" asChild className="gap-2">
          <Link to="/admin"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Link>
        </Button>
        <h1 className="text-3xl font-extrabold text-primary">Quiz Creator</h1>
        <div className="w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* Column 1: Main Form (2/3 width on desktop) */}
        <Card className="lg:col-span-2 shadow-xl border-none">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <FilePlus className="h-5 w-5 text-primary" /> Manual Entry
            </CardTitle> [cite: 182]
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Quiz Title</Label>
              <Input placeholder="Enter quiz title..." className="h-11" /> [cite: 182]
            </div>

            <div className="space-y-2">
              <Label>Question Content</Label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Type your question here..."
              /> [cite: 183]
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label>Correct Answer</Label>
                <Input placeholder="Correct choice (e.g. A)" /> [cite: 184]
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <Button variant="secondary" className="w-full gap-2">
                  <PlusCircle className="h-4 w-4" /> Add to Choice List
                </Button> [cite: 185]
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t bg-muted/10 p-6 flex flex-col sm:flex-row gap-4">
            <Button className="flex-1 gap-2"><Save className="h-4 w-4" /> Upload Items</Button> [cite: 186]
            <Button variant="outline" className="flex-1 gap-2 border-primary text-primary hover:bg-primary/10">
              Upload Full Quiz
            </Button> [cite: 186]
          </CardFooter>
        </Card>

        {/* Column 2: Choices List / Preview (1/3 width on desktop) */}
        <Card className="shadow-xl border-none">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider">
              <ListChecks className="h-4 w-4" /> Choices Preview
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-3">
              {/* This mirrors the .list-choices-item logic */}
              <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent-foreground">
                <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[10px] text-white font-bold">A</div>
                <span className="text-sm font-medium text-foreground">Sample Choice Text</span>
              </div> [cite: 187, 502, 503]
              
              <p className="text-xs text-muted-foreground text-center italic mt-4">
                Choices added will appear here as previews.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}