import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCities, type City } from '@/hooks/use-cities';

interface CitySearchProps {
  value?: string;
  onSelect: (city: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CitySearch({ 
  value, 
  onSelect, 
  placeholder = "Buscar cidade...",
  disabled = false,
  className 
}: CitySearchProps) {
  const [open, setOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const { cities, isLoading, searchCities, searchTerm } = useCities();

  // Atualizar cidade selecionada quando o value mudar
  useEffect(() => {
    if (value && !selectedCity) {
      // Se o valor já tem o formato "Cidade - Estado", usar diretamente
      if (value.includes(' - ')) {
        const [cityName, state] = value.split(' - ');
        setSelectedCity({
          id: 0,
          name: cityName,
          state: state,
          fullName: value,
          region: ''
        });
      }
    }
  }, [value, selectedCity]);

  const handleSelect = (city: City) => {
    setSelectedCity(city);
    onSelect(city.fullName);
    setOpen(false);
  };

  const handleInputChange = (search: string) => {
    searchCities(search);
  };

  const displayValue = selectedCity ? selectedCity.fullName : value || '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 opacity-50" />
            <span className="truncate">
              {displayValue || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" side="bottom" align="start">
        <Command>
          <CommandInput
            placeholder="Digite o nome da cidade..."
            onValueChange={handleInputChange}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Buscando cidades...</span>
                </div>
              ) : searchTerm.length >= 2 ? (
                "Nenhuma cidade encontrada."
              ) : (
                "Digite pelo menos 2 caracteres para buscar."
              )}
            </CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.id}
                  value={city.fullName}
                  onSelect={() => handleSelect(city)}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedCity?.id === city.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <MapPin className="h-4 w-4 opacity-50" />
                  <div className="flex flex-col">
                    <span className="font-medium">{city.fullName}</span>
                    <span className="text-sm text-muted-foreground">
                      {city.region}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}