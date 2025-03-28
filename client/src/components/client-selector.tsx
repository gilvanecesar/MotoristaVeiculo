import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
  const { user, loginMutation, logoutMutation, isLoading } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    loginMutation.mutate({ 
      email: "usuario@exemplo.com", 
      password: "senha123"
    }, {
      onSuccess: () => {
        toast({
          title: "Login realizado",
          description: "Você está logado no sistema.",
        });
        setLoginDialogOpen(false);
      }
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logout realizado",
          description: "Você desconectou da sua conta de cliente.",
        });
      }
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
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              <span className="max-w-[120px] truncate">{user.name}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Usuário: {user.profileType}</DropdownMenuLabel>
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
            <DialogTitle>Login de Usuário</DialogTitle>
            <DialogDescription>
              Entre com seu email e senha para acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 border rounded-md" 
                placeholder="seu@email.com"
                value="usuario@exemplo.com"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <input 
                type="password" 
                className="w-full px-3 py-2 border rounded-md" 
                placeholder="********"
                value="senha123"
                readOnly
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLogin} disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (
                <span className="flex items-center">
                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent"></span>
                  Carregando...
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}