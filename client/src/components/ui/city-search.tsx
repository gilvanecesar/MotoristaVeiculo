import { useState, useEffect } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface City {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
        nome: string;
      };
    };
  };
}

interface CitySearchProps {
  value?: string;
  onSelect: (city: string, state: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CitySearch({ value, onSelect, placeholder = "Selecione uma cidade...", disabled }: CitySearchProps) {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const searchCities = async (term: string) => {
    if (term.length < 2) {
      setCities([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(term)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setCities(data.slice(0, 50)); // Limitar a 50 resultados
      }
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchCities(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const formatCityDisplay = (city: City) => {
    return `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Digite o nome da cidade..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Buscando cidades..." : searchTerm.length < 2 ? "Digite pelo menos 2 caracteres" : "Nenhuma cidade encontrada."}
            </CommandEmpty>
            <CommandGroup>
              {cities.map((city) => {
                const displayValue = formatCityDisplay(city);
                return (
                  <CommandItem
                    key={city.id}
                    value={displayValue}
                    onSelect={() => {
                      onSelect(city.nome, city.microrregiao.mesorregiao.UF.sigla);
                      setOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === displayValue ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {displayValue}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}