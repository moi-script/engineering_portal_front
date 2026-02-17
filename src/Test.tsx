import React from "react";
import { ShieldCheck, Rocket, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TestComponent() {
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-6 text-foreground">
      <Card className="w-full max-w-2xl border-none shadow-2xl bg-card">
        {/* Decorative Top Bar using your Primary Blue */}
        <div className="h-2 w-full bg-primary" />
        
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Palette className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Configuration Test</CardTitle>
          <CardDescription>
            If this card is white and centered, your layout is working.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Testing your Primary and Accent Colors */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Rocket size={18} className="text-primary" /> 
                Primary Test
              </h4>
              <p className="text-xs text-muted-foreground">This box should have a subtle Stone-100 background.</p>
              <Button className="w-full">Primary Button</Button>
            </div>

            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-accent">
                <ShieldCheck size={18} /> 
                Accent Test
              </h4>
              <p className="text-xs text-muted-foreground">This box should use your Teal accent theme.</p>
              <Badge variant="outline" className="border-accent text-accent">Teal Badge</Badge>
            </div>
          </div>

          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 text-center">
            <p className="text-sm font-medium text-destructive">
              System Check: Professional Design System Loaded
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}