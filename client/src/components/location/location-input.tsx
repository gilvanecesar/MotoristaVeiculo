import React, { useState, ChangeEvent, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
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

// Interface para os dados da cidade retornados da API
interface IbgeCity {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
      }
    }
  }
}

// Interface para sugestões no formato que queremos exibir
interface CitySuggestion {
  id: number;
  name: string;
  fullName: string;
  state: string;
  displayText: string;
}

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = "Digite a cidade e estado (ex: Contagem - MG)",
  errorMessage,
  disabled = false,
  onStateChange,
  onCityChange
}) => {
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Referência para o input que podemos usar para foco
  const inputRef = useRef<HTMLInputElement>(null);

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
    setSearchTerm(newValue);
    
    if (newValue.length >= 3) {
      searchCities(newValue);
      setOpen(true); // Abrir o popover quando começar a digitar
    } else {
      setCitySuggestions([]);
    }
  };

  // Buscar cidades da API do IBGE
  const searchCities = async (query: string) => {
    if (query.length < 3) return;
    setLoading(true);
    
    try {
      // Remover " - UF" para buscar apenas pelo nome da cidade
      const searchQuery = query.includes(" - ") ? query.split(" - ")[0] : query;
      
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${searchQuery}`);
      
      if (response.ok) {
        const cities: IbgeCity[] = await response.json();
        
        // Formatar os resultados para exibição
        const suggestions: CitySuggestion[] = cities.map(city => {
          const state = city.microrregiao.mesorregiao.UF.sigla;
          return {
            id: city.id,
            name: city.nome,
            fullName: `${city.nome} - ${state}`,
            state,
            displayText: `${city.nome} - ${state}`
          };
        });
        
        setCitySuggestions(suggestions);
      }
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
    } finally {
      setLoading(false);
    }
  };

  // Selecionar uma sugestão
  const selectSuggestion = (suggestion: CitySuggestion) => {
    // Certifique-se de que estamos definindo o valor do campo e do estado corretamente
    if (!suggestion.name || !suggestion.state) {
      // Se não tiver nome ou estado, vamos criar uma sugestão válida com o que temos
      suggestion.name = suggestion.name || "Cidade";
      suggestion.state = suggestion.state || "UF";
      suggestion.fullName = `${suggestion.name} - ${suggestion.state}`;
      suggestion.displayText = suggestion.fullName;
    }
    
    console.log("Selecionando cidade:", suggestion);
    
    // Garantir que o formato da cidade está correto (Nome - UF)
    const formattedValue = `${suggestion.name} - ${suggestion.state}`;
    
    // Chamar o callback com o valor formatado
    onChange(formattedValue);
    
    // Definir o termo de pesquisa como o nome completo para consistência
    setSearchTerm(formattedValue);
    setOpen(false);
    
    // Chamar callbacks específicos caso estejam definidos
    if (onCityChange) onCityChange(suggestion.name);
    if (onStateChange) onStateChange(suggestion.state);
    
    // Garantir que as sugestões sejam limpas após a seleção para evitar conflitos
    setCitySuggestions([]);
  };

  // Buscar cidades quando o usuário digita no campo de pesquisa do popover
  useEffect(() => {
    if (searchTerm.length >= 3) {
      searchCities(searchTerm);
    }
  }, [searchTerm]);

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`${errorMessage ? "border-red-500" : ""} pr-10`}
                onClick={() => {
                  setOpen(true);
                  // Focar o input quando clicado
                  inputRef.current?.focus();
                }}
              />
              <ChevronsUpDown className="h-4 w-4 opacity-50 absolute right-3 top-3" />
            </div>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Digite pelo menos 3 letras para buscar..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {loading && <div className="p-2 text-center">Buscando...</div>}
              
              <CommandEmpty>Nenhuma cidade encontrada</CommandEmpty>
              
              {citySuggestions.length > 0 && (
                <CommandGroup heading="Cidades">
                  {citySuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      value={suggestion.fullName}
                      onSelect={() => selectSuggestion(suggestion)}
                    >
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{suggestion.name}</span>
                      <span className="ml-1 text-muted-foreground">{suggestion.state && ` - ${suggestion.state}`}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {citySuggestions.length === 0 && searchTerm.length < 3 && (
                <CommandGroup heading="Estados">
                  {BRAZILIAN_STATES.map((state) => (
                    <CommandItem
                      key={state.value}
                      value={state.value}
                      onSelect={() => {
                        const cityName = searchTerm || "Cidade";
                        const suggestion: CitySuggestion = {
                          id: 0,
                          name: cityName,
                          fullName: `${cityName} - ${state.value}`,
                          state: state.value,
                          displayText: `${cityName} - ${state.value}`
                        };
                        selectSuggestion(suggestion);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.endsWith(` - ${state.value}`) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {state.label} - {state.value}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
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