import React, { useState, ChangeEvent, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompleteIBGECity, searchCitiesByName } from "@/lib/utils/ibge-api";

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

// Interface para sugestões no formato que queremos exibir
interface CitySuggestion {
  id: number;
  name: string;
  fullName: string;
  state: string;
  displayText: string;
}

// Lista de cidades principais por estado para usar como fallback
const POPULAR_CITIES: Record<string, string[]> = {
  "SP": ["São Paulo", "Campinas", "Guarulhos", "Santos", "Ribeirão Preto"],
  "RJ": ["Rio de Janeiro", "Niterói", "São Gonçalo", "Duque de Caxias"],
  "MG": ["Belo Horizonte", "Contagem", "Juiz de Fora", "Uberlândia", "Betim"],
  "RS": ["Porto Alegre", "Caxias do Sul", "Canoas", "Pelotas"],
  "PR": ["Curitiba", "Londrina", "Maringá", "Ponta Grossa"],
  "BA": ["Salvador", "Feira de Santana", "Vitória da Conquista"],
  "GO": ["Goiânia", "Anápolis", "Aparecida de Goiânia"],
  "SC": ["Florianópolis", "Joinville", "Blumenau"],
  "PE": ["Recife", "Jaboatão dos Guararapes", "Olinda"],
  "CE": ["Fortaleza", "Caucaia", "Juazeiro do Norte"]
};

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

  // Buscar cidades usando a API do IBGE
  const searchCities = async (query: string) => {
    if (query.length < 3) return;
    setLoading(true);
    
    try {
      // Remover " - UF" para buscar apenas pelo nome da cidade
      const searchQuery = query.includes(" - ") ? query.split(" - ")[0] : query;
      
      console.log("Buscando cidades com a query:", searchQuery);
      
      const cities = await searchCitiesByName(searchQuery);
      console.log("Cidades encontradas:", cities);
      
      if (cities.length > 0) {
        // Formatar os resultados para exibição
        const suggestions: CitySuggestion[] = cities.map(city => {
          try {
            const state = city.microrregiao?.mesorregiao?.UF?.sigla || "N/A";
            return {
              id: city.id,
              name: city.nome,
              fullName: `${city.nome} - ${state}`,
              state,
              displayText: `${city.nome} - ${state}`
            };
          } catch (err) {
            console.error("Erro ao processar cidade:", city, err);
            return {
              id: city.id || 0,
              name: city.nome || "Desconhecido",
              fullName: `${city.nome || "Desconhecido"} - N/A`,
              state: "N/A",
              displayText: `${city.nome || "Desconhecido"} - N/A`
            };
          }
        });
        
        console.log("Sugestões formatadas:", suggestions);
        setCitySuggestions(suggestions);
      } else {
        // Se a API não retornar resultados, use o fallback
        console.log("Usando sugestões populares como fallback");
        
        // Verificar se o termo de busca tem alguma correspondência com estados
        const stateMatch = BRAZILIAN_STATES.find(
          state => state.value.toLowerCase() === searchQuery.toLowerCase() || 
                  state.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (stateMatch) {
          // Se corresponder a um estado, mostrar cidades populares daquele estado
          const popularCities = POPULAR_CITIES[stateMatch.value] || [];
          const fallbackSuggestions: CitySuggestion[] = popularCities.map((cityName, index) => ({
            id: index,
            name: cityName,
            fullName: `${cityName} - ${stateMatch.value}`,
            state: stateMatch.value,
            displayText: `${cityName} - ${stateMatch.value}`
          }));
          
          setCitySuggestions(fallbackSuggestions);
        } else {
          // Se não corresponder a um estado, mostrar sugestão com o texto digitado
          // para cada estado brasileiro
          const fallbackSuggestions: CitySuggestion[] = BRAZILIAN_STATES.slice(0, 5).map(state => ({
            id: 0,
            name: searchQuery,
            fullName: `${searchQuery} - ${state.value}`,
            state: state.value,
            displayText: `${searchQuery} - ${state.value}`
          }));
          
          setCitySuggestions(fallbackSuggestions);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
      // Usar fallback em caso de erro
      const fallbackSuggestions: CitySuggestion[] = BRAZILIAN_STATES.slice(0, 5).map(state => ({
        id: 0,
        name: query,
        fullName: `${query} - ${state.value}`,
        state: state.value,
        displayText: `${query} - ${state.value}`
      }));
      
      setCitySuggestions(fallbackSuggestions);
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