import React, { useState } from "react";
import { X, Delete, Divide, Plus, Minus, Equal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CalculatorProps {
  onClose: () => void;
}

export default function CalculatorTool({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNum = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOp = (op: string) => {
    setOperator(op);
    setPrevValue(display);
    setNewNumber(true);
  };

  const calculate = () => {
    if (!prevValue || !operator) return;
    const current = parseFloat(display);
    const prev = parseFloat(prevValue);
    let result = 0;

    switch (operator) {
      case "+": result = prev + current; break;
      case "-": result = prev - current; break;
      case "*": result = prev * current; break;
      case "/": result = prev / current; break;
    }

    setDisplay(String(result));
    setOperator(null);
    setNewNumber(true);
  };

  const clear = () => {
    setDisplay("0");
    setPrevValue(null);
    setOperator(null);
    setNewNumber(true);
  };

  return (
    <Card className="fixed top-1/4 right-10 w-64 shadow-2xl z-50 border-stone-600 bg-stone-900 text-white animate-in fade-in slide-in-from-bottom-10">
      <CardHeader className="flex flex-row items-center justify-between py-2 bg-stone-800 rounded-t-xl">
        <CardTitle className="text-sm font-mono text-stone-400">Calc.exe</CardTitle>
        <Button variant="ghost" size="icon-xs" onClick={onClose} className="h-6 w-6 hover:bg-red-500 hover:text-white">
          <X size={14} />
        </Button>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-4 gap-2">
        {/* Display Screen */}
        <div className="col-span-4 bg-stone-800 p-3 rounded mb-2 text-right text-2xl font-mono tracking-widest overflow-hidden">
          {display}
        </div>

        {/* Buttons */}
        <CalcBtn label="C" onClick={clear} variant="destructive" className="col-span-2" />
        <CalcBtn label="÷" onClick={() => handleOp("/")} variant="secondary" />
        <CalcBtn label="×" onClick={() => handleOp("*")} variant="secondary" />
        
        {["7", "8", "9"].map((n) => <CalcBtn key={n} label={n} onClick={() => handleNum(n)} />)}
        <CalcBtn label="-" onClick={() => handleOp("-")} variant="secondary" />
        
        {["4", "5", "6"].map((n) => <CalcBtn key={n} label={n} onClick={() => handleNum(n)} />)}
        <CalcBtn label="+" onClick={() => handleOp("+")} variant="secondary" />
        
        {["1", "2", "3"].map((n) => <CalcBtn key={n} label={n} onClick={() => handleNum(n)} />)}
        <CalcBtn label="=" onClick={calculate} variant="default" className="row-span-2 h-full bg-emerald-600 hover:bg-emerald-500" />
        
        <CalcBtn label="0" onClick={() => handleNum("0")} className="col-span-2" />
        <CalcBtn label="." onClick={() => handleNum(".")} />
      </CardContent>
    </Card>
  );
}


interface CalcBtnProps {
  label: string;
  onClick: () => void;
  className?: string;
  // Restrict variant to allowed Shadcn Button variants
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

function CalcBtn({ label, onClick, className, variant = "outline" }: CalcBtnProps) {
  return (
    <Button 
      variant={variant} 
      onClick={onClick} 
      className={`text-lg font-bold h-10 ${className || ''}`}
    >
      {label}
    </Button>
  );
}