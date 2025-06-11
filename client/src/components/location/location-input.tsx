import React, { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorMessage?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onStateChange?: (state: string) => void;
  onCityChange?: (city: string) => void;
  stateField?: string;
  stateValue?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = "Digite a cidade e estado (ex: Contagem - MG)",
  errorMessage,
  disabled = false,
  readOnly = false,
  onStateChange,
  onCityChange
}) => {
  // Manipular a mudança direta no input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Extrair cidade e estado se o formato for "Cidade - UF"
    if (newValue.includes(" - ")) {
      const parts = newValue.split(" - ");
      if (parts.length === 2) {
        const city = parts[0].trim();
        const state = parts[1].trim();
        
        if (onCityChange) onCityChange(city);
        if (onStateChange) onStateChange(state);
      }
    }
  };

  return (
    <div className="w-full">
      <FormControl>
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || readOnly}
          readOnly={readOnly}
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