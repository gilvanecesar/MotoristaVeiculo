import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface ClientSelectorProps {
  selectedClientId: number | null;
  onClientSelect: (clientId: number | null) => void;
  readOnly?: boolean;
}

export default function ClientSelector({
  selectedClientId,
  onClientSelect,
  readOnly = false,
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  // Buscar lista de clientes
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      if (!res.ok) throw new Error("Falha ao carregar clientes");
      return await res.json();
    },
  });

  // Buscar detalhes do cliente selecionado, se houver
  const { data: selectedClient } = useQuery({
    queryKey: ["/api/clients", selectedClientId],
    enabled: !!selectedClientId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/clients/${selectedClientId}`);
      if (!res.ok) throw new Error("Falha ao carregar detalhes do cliente");
      return await res.json();
    },
  });

  // Se o usuário for do tipo cliente, selecionar automaticamente o cliente associado
  useEffect(() => {
    if (
      user?.profileType === "client" ||
      user?.profileType === "cliente" || 
      user?.profileType === "embarcador" || 
      user?.profileType === "shipper"
    ) {
      if (user.clientId && !selectedClientId) {
        onClientSelect(user.clientId);
      }
    }
  }, [user, selectedClientId, onClientSelect]);

  // Se estiver carregando, mostra apenas o texto carregando
  if (isLoading) {
    return (
      <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        Carregando clientes...
      </div>
    );
  }

  // Se o componente for somente leitura, mostrar apenas o nome do cliente
  if (readOnly) {
    return (
      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
        {selectedClient?.name || "Nenhum cliente selecionado"}
      </div>
    );
  }

  // Se o usuário for do tipo cliente, mostrar apenas o cliente associado
  if (
    (user?.profileType === "client" || 
     user?.profileType === "cliente" || 
     user?.profileType === "embarcador" || 
     user?.profileType === "shipper") && 
    user.clientId
  ) {
    return (
      <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm">
        {selectedClient?.name || "Cliente associado"}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedClient
            ? selectedClient.name
            : "Selecione um cliente"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {clients.map((client: any) => (
              <CommandItem
                key={client.id}
                value={client.name}
                onSelect={() => {
                  onClientSelect(client.id === selectedClientId ? null : client.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedClientId === client.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {client.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}