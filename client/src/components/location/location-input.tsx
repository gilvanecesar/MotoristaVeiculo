import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MapPin, Loader2 } from "lucide-react";

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

interface IBGECity {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
        nome: string;
      }
    }
  }
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
  const [citySuggestions, setCitySuggestions] = useState<IBGECity[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar searchTerm com value
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Buscar cidades usando a API do IBGE
  const searchCities = async (query: string) => {
    console.log("searchCities chamada com query:", query);
    
    if (query.length < 3) {
      console.log("Query muito curta, ignorando busca");
      setCitySuggestions([]);
      return;
    }

    console.log("Iniciando busca de cidades...");
    setLoading(true);
    try {
      // Remover " - UF" para buscar apenas pelo nome da cidade
      const searchQuery = query.includes(" - ") ? query.split(" - ")[0] : query;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      console.log("Buscando cidades para:", searchQuery, "encoded:", encodedQuery);
      
      const url = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodedQuery}`;
      console.log("URL da API:", url);
      
      const response = await fetch(url);
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const cities = await response.json();
        console.log("Cidades encontradas:", cities.length, cities);
        setCitySuggestions(cities.slice(0, 10)); // Limitar a 10 resultados
      } else {
        console.log("Response não OK:", response.status, response.statusText);
        setCitySuggestions([]);
      }
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
      setCitySuggestions([]);
    } finally {
      setLoading(false);
      console.log("Busca finalizada");
    }
  };

  // Manipular mudança no input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    
    console.log("Input change:", newValue);
    
    // Debounce a busca
    if (newValue.length >= 3) {
      console.log("Abrindo popover e iniciando busca");
      setOpen(true);
      
      // Usar setTimeout para evitar muitas chamadas
      setTimeout(() => {
        if (newValue === searchTerm) { // Verificar se ainda é o mesmo valor
          searchCities(newValue);
        }
      }, 500);
    } else {
      console.log("Query muito curta, fechando popover");
      setOpen(false);
      setCitySuggestions([]);
    }

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

  // Selecionar uma sugestão
  const selectSuggestion = (city: IBGECity) => {
    const state = city.microrregiao?.mesorregiao?.UF?.sigla || "";
    const formattedValue = `${city.nome} - ${state}`;
    
    onChange(formattedValue);
    setSearchTerm(formattedValue);
    setOpen(false);
    setCitySuggestions([]);
    
    if (onCityChange) onCityChange(city.nome);
    if (onStateChange) onStateChange(state);
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={disabled || readOnly}
              readOnly={readOnly}
              className={errorMessage ? "border-red-500" : ""}
              onClick={() => {
                if (!readOnly && searchTerm.length >= 3) {
                  setOpen(true);
                }
              }}
            />
          </FormControl>
        </PopoverTrigger>
        {citySuggestions.length > 0 && (
          <PopoverContent className="w-[350px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Buscar cidade..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                {loading && (
                  <div className="p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    <span className="text-sm text-muted-foreground">Buscando cidades...</span>
                  </div>
                )}
                
                <CommandEmpty>Nenhuma cidade encontrada</CommandEmpty>
                
                {citySuggestions.length > 0 && (
                  <CommandGroup heading="Cidades encontradas">
                    {citySuggestions.map((city) => (
                      <CommandItem
                        key={city.id}
                        value={`${city.nome} - ${city.microrregiao?.mesorregiao?.UF?.sigla}`}
                        onSelect={() => selectSuggestion(city)}
                      >
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{city.nome}</span>
                        <span className="ml-1 text-muted-foreground">
                          - {city.microrregiao?.mesorregiao?.UF?.sigla}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
      {errorMessage && (
        <div className="text-red-500 text-sm mt-1">{errorMessage}</div>
      )}
    </div>
  );
};

export default LocationInput;