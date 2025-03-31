import React, { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorMessage?: string;
  disabled?: boolean;
}

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = "Digite a cidade e estado (ex: Contagem - MG)",
  errorMessage,
  disabled = false
}) => {
  // Função para validar o formato da localização
  const validateLocation = (input: string): boolean => {
    // Aceita formatos como "Cidade - UF" ou apenas "Cidade"
    return true; // Validação básica, pode ser mais rigorosa se necessário
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="w-full">
      <FormControl>
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={errorMessage ? "border-red-500" : ""}
        />
      </FormControl>
      {errorMessage && (
        <div className="text-red-500 text-sm mt-1">{errorMessage}</div>
      )}
    </div>
  );
};

export default LocationInput;