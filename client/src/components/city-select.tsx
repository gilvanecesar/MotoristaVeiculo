import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IBGECity, fetchCitiesByState } from "@/lib/utils/ibge-api";

interface CitySelectProps {
  state: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  errorMessage?: string;
}

export function CitySelect({
  state,
  value,
  onChange,
  disabled = false,
  placeholder = "Selecione uma cidade",
  errorMessage,
}: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loading, setLoading] = useState(false);
  const [cityName, setCityName] = useState("");

  // Busca as cidades quando o estado muda
  useEffect(() => {
    // Não busca se não tiver estado definido
    if (!state) {
      setCities([]);
      return;
    }

    setLoading(true);
    fetchCitiesByState(state)
      .then((data) => {
        setCities(data);
        
        // Se um valor estiver definido, busca o nome da cidade
        if (value) {
          const city = data.find(city => city.nome === value);
          if (city) {
            setCityName(city.nome);
          }
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar cidades:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [state, value]);

  // Atualiza o nome da cidade quando o valor muda (para caso de reset do form)
  useEffect(() => {
    if (value && cities.length > 0) {
      const city = cities.find(city => city.nome === value);
      if (city) {
        setCityName(city.nome);
      } else {
        setCityName("");
      }
    } else if (!value) {
      setCityName("");
    }
  }, [value, cities]);

  return (
    <div className="flex flex-col space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || !state || loading}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              errorMessage && "border-red-500"
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando...</span>
              </div>
            ) : cityName || value ? (
              cityName || value
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar cidade..." />
            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {cities.map((city) => (
                <CommandItem
                  key={city.id}
                  value={city.nome}
                  onSelect={(currentValue) => {
                    setCityName(currentValue);
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city.nome ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {errorMessage && (
        <p className="text-sm font-medium text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}