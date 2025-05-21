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
  // Função para lidar com o clique em qualquer parte do componente
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(!checked);
  };

  return (
    <div 
      className="flex items-center space-x-2 cursor-pointer" 
      onClick={handleClick}
    >
      <div
        role="checkbox"
        aria-checked={checked}
        id={id}
        className={cn(
          "flex items-center justify-center h-6 w-6 shrink-0 rounded-md border-2 border-primary focus:outline-none",
          checked ? "bg-primary" : "bg-transparent",
          className
        )}
      >
        {checked && (
          <Check className="h-4 w-4 text-white" />
        )}
      </div>
      
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
}