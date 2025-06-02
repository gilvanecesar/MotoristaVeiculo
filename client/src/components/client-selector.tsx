import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, User, ChevronDown, Package, RotateCcw, Clock, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
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
  const queryClient = useQueryClient();
  
  // Para debug
  useEffect(() => {
    if (user) {
      console.log("ClientSelector - profileType:", user.profileType);
    }
  }, [user]);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [freightsDialogOpen, setFreightsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Buscar fretes do usuário atual
  const { data: userFreights = [], isLoading: freightsLoading } = useQuery({
    queryKey: ["/api/freights", "user", user?.id],
    enabled: !!user?.id && freightsDialogOpen,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/freights");
      if (!res.ok) throw new Error("Falha ao carregar fretes");
      const allFreights = await res.json();
      // Filtrar apenas fretes do usuário atual
      return allFreights.filter((freight: any) => freight.userId === user?.id);
    },
  });

  // Mutação para reativar frete
  const reactivateFreightMutation = useMutation({
    mutationFn: async (freightId: number) => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 24);
      
      const res = await apiRequest("PUT", `/api/freights/${freightId}`, {
        status: "active",
        expirationDate: expirationDate.toISOString()
      });
      if (!res.ok) throw new Error("Falha ao reativar frete");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Frete reativado",
        description: "O frete foi reativado com sucesso e ficará disponível por mais 24 horas.",
      });
      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível reativar o frete.",
        variant: "destructive",
      });
    },
  });

  // Função para formatar data
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para verificar se o frete está expirado
  const isExpired = (expirationDate: string | Date | null) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

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
            <DropdownMenuLabel>Usuário: {
              user.profileType === "admin" ? "Administrador" :
              user.profileType === "driver" ? "Motorista" :
              user.profileType === "shipper" ? "Embarcador" :
              user.profileType === "agent" ? "Agente" :
              user.profileType // Se já estiver em português, mantem
            }</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFreightsDialogOpen(true)}>
              <Package className="h-4 w-4 mr-2" />
              Meus Fretes
            </DropdownMenuItem>
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

      {/* Diálogo de Fretes do Usuário */}
      <Dialog open={freightsDialogOpen} onOpenChange={setFreightsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Meus Fretes</DialogTitle>
            <DialogDescription>
              Lista dos fretes que você cadastrou no sistema. Você pode reativar fretes expirados para ficarem disponíveis por mais 24 horas.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] w-full">
            {freightsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Carregando fretes...</span>
              </div>
            ) : userFreights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Você ainda não cadastrou nenhum frete.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userFreights.map((freight: any) => (
                  <div key={freight.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">Frete #{freight.id}</h3>
                          <Badge variant={
                            freight.status === 'active' ? 'default' :
                            freight.status === 'expired' ? 'destructive' :
                            freight.status === 'completed' ? 'secondary' :
                            'outline'
                          }>
                            {freight.status === 'active' ? 'Ativo' :
                             freight.status === 'expired' ? 'Expirado' :
                             freight.status === 'completed' ? 'Concluído' :
                             freight.status}
                          </Badge>
                          {isExpired(freight.expirationDate) && freight.status === 'active' && (
                            <Badge variant="destructive">Expirado</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span><strong>Origem:</strong> {freight.origin}, {freight.originState}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <span><strong>Destino:</strong> {freight.destination}, {freight.destinationState}</span>
                          </div>
                          
                          {freight.destination1 && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span><strong>Destino 2:</strong> {freight.destination1}, {freight.destinationState1}</span>
                            </div>
                          )}
                          
                          {freight.destination2 && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span><strong>Destino 3:</strong> {freight.destination2}, {freight.destinationState2}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-600" />
                            <span><strong>Criado em:</strong> {formatDate(freight.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span><strong>Expira em:</strong> {formatDate(freight.expirationDate)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {(isExpired(freight.expirationDate) || freight.status === 'expired') && (
                        <Button
                          size="sm"
                          onClick={() => reactivateFreightMutation.mutate(freight.id)}
                          disabled={reactivateFreightMutation.isPending}
                          className="ml-4"
                        >
                          {reactivateFreightMutation.isPending ? (
                            <span className="flex items-center">
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent"></div>
                              Reativando...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reativar
                            </span>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreightsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}