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
import { IBGEState, fetchStates } from "@/lib/utils/ibge-api";

interface StateSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  errorMessage?: string;
}

export function StateSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecione um estado",
  errorMessage,
}: StateSelectProps) {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<IBGEState[]>([]);
  const [loading, setLoading] = useState(false);
  const [stateName, setStateName] = useState("");

  // Busca os estados ao montar o componente
  useEffect(() => {
    setLoading(true);
    fetchStates()
      .then((data) => {
        setStates(data);
        
        // Se um valor estiver definido, busca o nome do estado
        if (value) {
          const state = data.find(state => state.sigla === value);
          if (state) {
            setStateName(state.nome);
          }
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar estados:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [value]);

  // Atualiza o nome do estado quando o valor muda (para caso de reset do form)
  useEffect(() => {
    if (value && states.length > 0) {
      const state = states.find(state => state.sigla === value);
      if (state) {
        setStateName(state.nome);
      } else {
        setStateName("");
      }
    } else if (!value) {
      setStateName("");
    }
  }, [value, states]);

  return (
    <div className="flex flex-col space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
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
            ) : stateName || value ? (
              value ? `${stateName} (${value})` : value
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar estado..." />
            <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {states.map((state) => (
                <CommandItem
                  key={state.id}
                  value={state.nome}
                  onSelect={() => {
                    setStateName(state.nome);
                    onChange(state.sigla);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === state.sigla ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {state.nome} ({state.sigla})
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