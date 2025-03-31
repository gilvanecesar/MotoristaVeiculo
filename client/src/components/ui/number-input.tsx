import React, { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form";

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorMessage?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  placeholder = "",
  errorMessage,
  disabled = false,
  min,
  max,
  step,
  className = ""
}) => {
  // Função para formatar o valor de entrada
  const formatValue = (input: string): string => {
    // Remove caracteres não numéricos, exceto vírgula e ponto
    const cleanInput = input.replace(/[^\d.,]/g, "");

    // Substitui vírgula por ponto para processamento
    let processedInput = cleanInput.replace(/,/g, ".");

    // Garante que apenas um ponto decimal esteja presente
    const parts = processedInput.split(".");
    if (parts.length > 2) {
      processedInput = parts[0] + "." + parts.slice(1).join("");
    }

    return processedInput;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatValue(rawValue);
    
    // Se o valor for vazio, não tenta converter para número
    if (formattedValue === "") {
      onChange("");
      return;
    }

    // Valida limites min/max se especificados
    if (formattedValue !== "") {
      const numValue = parseFloat(formattedValue);
      
      if (!isNaN(numValue)) {
        if (min !== undefined && numValue < min) {
          onChange(min.toString());
          return;
        }
        
        if (max !== undefined && numValue > max) {
          onChange(max.toString());
          return;
        }
      }
    }

    onChange(formattedValue);
  };

  return (
    <div className="w-full">
      <FormControl>
        <Input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${className} ${errorMessage ? "border-red-500" : ""}`}
          step={step}
        />
      </FormControl>
      {errorMessage && (
        <div className="text-red-500 text-sm mt-1">{errorMessage}</div>
      )}
    </div>
  );
};

export default NumberInput;