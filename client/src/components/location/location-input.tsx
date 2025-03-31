import React, { useState, ChangeEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorMessage?: string;
  disabled?: boolean;
  onStateChange?: (state: string) => void;
  onCityChange?: (city: string) => void;
}

// Lista de estados brasileiros para sugestões
const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" }
];

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = "Digite a cidade e estado (ex: Contagem - MG)",
  errorMessage,
  disabled = false,
  onStateChange,
  onCityChange
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Extrair estado da localização atual (se existir)
  useEffect(() => {
    if (value && value.includes(" - ")) {
      const state = value.split(" - ")[1];
      if (state && onStateChange) {
        onStateChange(state);
      }
    }
  }, [value, onStateChange]);

  // Manipular a mudança direta no input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Se o usuário está digitando um estado, mostrar sugestões
    if (newValue.includes(" - ") || newValue.length >= 3) {
      generateSuggestions(newValue);
    } else {
      setSuggestions([]);
    }
  };

  // Gerar sugestões com base na entrada
  const generateSuggestions = (input: string) => {
    if (input.length < 3) return;

    // Se já tem o formato "Cidade - UF", sugerir estados
    if (input.includes(" - ")) {
      const [city, statePrefix] = input.split(" - ");
      
      if (statePrefix && statePrefix.length > 0) {
        const matchingStates = BRAZILIAN_STATES.filter(state => 
          state.value.startsWith(statePrefix.toUpperCase()) || 
          state.label.toLowerCase().startsWith(statePrefix.toLowerCase())
        );
        
        const formattedSuggestions = matchingStates.map(state => `${city} - ${state.value}`);
        setSuggestions(formattedSuggestions);
      }
    }
  };

  // Selecionar uma sugestão
  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setOpen(false);
    
    // Extrair cidade e estado para callbacks
    if (suggestion.includes(" - ")) {
      const [city, state] = suggestion.split(" - ");
      if (onCityChange) onCityChange(city);
      if (onStateChange) onStateChange(state);
    }
  };

  // Atualizar sugestões quando o usuário digita no campo de pesquisa do popover
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const matchingStates = BRAZILIAN_STATES.filter(state => 
        state.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      let newSuggestions: string[] = [];
      
      // Se o valor atual tem uma cidade, manter a cidade e sugerir diferentes estados
      if (value && value.includes(" - ")) {
        const [city] = value.split(" - ");
        newSuggestions = matchingStates.map(state => `${city} - ${state.value}`);
      } else {
        // Se não tem cidade ainda, criar sugestões com a entrada atual como cidade
        newSuggestions = matchingStates.map(state => `${searchTerm} - ${state.value}`);
      }
      
      setSuggestions(newSuggestions);
    }
  }, [searchTerm, value]);

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <div className="relative">
              <Input
                type="text"
                value={value}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`${errorMessage ? "border-red-500" : ""} pr-10`}
                onClick={() => setOpen(true)}
              />
              <ChevronsUpDown className="h-4 w-4 opacity-50 absolute right-3 top-3" />
            </div>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Pesquisar cidade ou estado..."
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>Nenhuma sugestão encontrada</CommandEmpty>
              <CommandGroup heading="Sugestões">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      value={suggestion}
                      onSelect={() => selectSuggestion(suggestion)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === suggestion ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {suggestion}
                    </CommandItem>
                  ))
                ) : (
                  BRAZILIAN_STATES.map((state) => {
                    const cityPrefix = value.split(" - ")[0] || "";
                    const suggestion = `${cityPrefix} - ${state.value}`;
                    return (
                      <CommandItem
                        key={state.value}
                        value={suggestion}
                        onSelect={() => selectSuggestion(suggestion)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === suggestion ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {suggestion}
                      </CommandItem>
                    );
                  })
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {errorMessage && (
        <div className="text-red-500 text-sm mt-1">{errorMessage}</div>
      )}
    </div>
  );
};

export default LocationInput;