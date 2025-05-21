import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
  label?: string;
  className?: string;
}

export function CustomCheckbox({ 
  checked, 
  onChange, 
  id, 
  label,
  className 
}: CustomCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        id={id}
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          checked ? "bg-primary text-primary-foreground" : "bg-background",
          className
        )}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <Check className="h-4 w-4 text-white" />
        )}
      </button>
      
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium leading-none cursor-pointer"
          onClick={() => onChange(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  );
}