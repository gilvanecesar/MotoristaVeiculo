import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ClientSelector() {
  const { currentClient, login, logout, isLoading } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const { toast } = useToast();

  // Buscar lista de clientes
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    enabled: true,
  });

  // Reset do cliente selecionado quando o diálogo é aberto
  useEffect(() => {
    if (loginDialogOpen) {
      setSelectedClientId("");
    }
  }, [loginDialogOpen]);

  const handleLogin = async () => {
    if (!selectedClientId) {
      toast({
        title: "Selecione um cliente",
        description: "Por favor, selecione um cliente para continuar.",
        variant: "destructive",
      });
      return;
    }

    const success = await login(parseInt(selectedClientId));
    if (success) {
      toast({
        title: "Login realizado",
        description: "Você está logado como cliente.",
      });
      setLoginDialogOpen(false);
    } else {
      toast({
        title: "Falha no login",
        description: "Não foi possível fazer login como este cliente.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Você desconectou da sua conta de cliente.",
    });
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4 mr-2" />
        Carregando...
      </Button>
    );
  }

  return (
    <>
      {currentClient ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              <span className="max-w-[120px] truncate">{currentClient.name}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Cliente logado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLoginDialogOpen(true)}
          className="flex items-center justify-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          Login como Cliente
        </Button>
      )}

      {/* Diálogo de Login */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login como Cliente</DialogTitle>
            <DialogDescription>
              Selecione o cliente que você deseja representar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLogin}>
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}