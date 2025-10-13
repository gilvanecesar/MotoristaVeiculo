import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Truck, 
  Eye, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  CreditCard,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  Pencil,
  Trash2,
  Power,
  MoreHorizontal
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FreightWithDestinations } from "@shared/schema";
import { formatCurrency } from "@/lib/utils/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFreight, setSelectedFreight] = useState<FreightWithDestinations | null>(null);
  const [selectedFreights, setSelectedFreights] = useState<number[]>([]);

  // Buscar fretes do usuário
  const { data: freights = [] } = useQuery<FreightWithDestinations[]>({
    queryKey: ["/api/freights"],
    enabled: !!user,
  });

  // Filtrar apenas os fretes do usuário atual
  const userFreights = freights.filter(f => f.userId === user?.id);
  
  // Calcular métricas
  const activeFreights = userFreights.filter(f => {
    if (!f.expirationDate) return true;
    return new Date(f.expirationDate) > new Date();
  }).length;

  // Mutation para deletar frete
  const deleteMutation = useMutation({
    mutationFn: async (freightId: number) => {
      return apiRequest('DELETE', `/api/freights/${freightId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
      toast({
        title: "Frete excluído",
        description: "O frete foi excluído com sucesso.",
      });
      setDeleteDialogOpen(false);
      setSelectedFreight(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o frete.",
        variant: "destructive",
      });
    },
  });

  // Mutation para ativar/desativar frete (atualizar data de expiração)
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ freightId, activate }: { freightId: number; activate: boolean }) => {
      // Se ativar, adiciona 30 dias à data atual
      const expirationDate = activate 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : new Date().toISOString(); // Se desativar, define data como hoje (expirado)
      
      return apiRequest('PATCH', `/api/freights/${freightId}`, { expirationDate });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
      toast({
        title: variables.activate ? "Frete ativado" : "Frete desativado",
        description: variables.activate 
          ? "O frete foi ativado por 30 dias." 
          : "O frete foi desativado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o frete.",
        variant: "destructive",
      });
    },
  });

  // Status da assinatura
  const hasActiveSubscription = user?.subscriptionActive;
  const subscriptionExpiry = user?.subscriptionExpiresAt 
    ? new Date(user.subscriptionExpiresAt)
    : null;

  const daysUntilExpiry = subscriptionExpiry 
    ? Math.ceil((subscriptionExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isFreightExpired = (freight: FreightWithDestinations) => {
    if (!freight.expirationDate) return false;
    return new Date(freight.expirationDate) <= new Date();
  };

  const toggleSelectFreight = (freightId: number) => {
    setSelectedFreights(prev => 
      prev.includes(freightId) 
        ? prev.filter(id => id !== freightId)
        : [...prev, freightId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFreights.length === userFreights.length) {
      setSelectedFreights([]);
    } else {
      setSelectedFreights(userFreights.map(f => f.id));
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Painel de Controle</h1>
        <p className="text-slate-500 mt-1">Acompanhe a performance dos seus fretes</p>
      </div>

      {/* Métricas em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fretes Postados */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">
                Fretes postados
              </CardTitle>
              <Package className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userFreights.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {activeFreights > 0 && (
                <span className="text-green-600">
                  {activeFreights} {activeFreights === 1 ? 'ativo' : 'ativos'}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Visualizações de Frete */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">
                Visualização de frete
              </CardTitle>
              <Eye className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">-</div>
            <p className="text-xs text-slate-500 mt-1">Em breve</p>
          </CardContent>
        </Card>

        {/* Motoristas Interessados */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">
                Motoristas interessados
              </CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">-</div>
            <p className="text-xs text-slate-500 mt-1">Em breve</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fretes Ativos - Layout de Tabela */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Seus Fretes
                </CardTitle>
                <CardDescription>
                  {activeFreights > 0 
                    ? `${activeFreights} ${activeFreights === 1 ? 'frete ativo' : 'fretes ativos'}` 
                    : 'Nenhum frete ativo'}
                </CardDescription>
              </div>
              {userFreights.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedFreights.length === userFreights.length && userFreights.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-slate-500">Selecionar todos</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {userFreights.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Nenhum frete postado ainda</p>
                <Button onClick={() => setLocation("/freights/new")}>
                  Criar frete
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {userFreights.slice(0, 5).map((freight) => {
                  const expired = isFreightExpired(freight);
                  const isSelected = selectedFreights.includes(freight.id);
                  
                  return (
                    <div 
                      key={freight.id} 
                      className={`
                        flex items-center gap-4 p-3 border rounded-lg transition-colors
                        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                      `}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectFreight(freight.id)}
                      />

                      {/* Informações do Frete */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">Frete Prev</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            expired 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {expired ? 'Expirado' : 'Alta negociação'}
                          </span>
                        </div>
                      </div>

                      {/* Origem */}
                      <div className="hidden md:block min-w-[140px]">
                        <p className="text-xs text-slate-500">Origem</p>
                        <p className="text-sm font-medium">{freight.origin}, {freight.originState}</p>
                      </div>

                      {/* Destino */}
                      <div className="hidden md:block min-w-[140px]">
                        <p className="text-xs text-slate-500">Destino</p>
                        <p className="text-sm font-medium">{freight.destination}, {freight.destinationState}</p>
                      </div>

                      {/* Tipo de Carga */}
                      <div className="hidden lg:block min-w-[100px]">
                        <p className="text-xs text-slate-500">Tipo</p>
                        <p className="text-sm font-medium">
                          {freight.cargoType === 'completa' ? 'Completa' : 'Complemento'}
                        </p>
                      </div>

                      {/* Valor */}
                      <div className="text-right min-w-[100px]">
                        <p className="text-lg font-bold text-primary">{formatCurrency(freight.freightValue)}</p>
                        <p className="text-xs text-slate-500">Por {freight.paymentMethod}</p>
                      </div>

                      {/* Menu de Ações */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/freights/${freight.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation(`/freights/${freight.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toggleActiveMutation.mutate({ 
                              freightId: freight.id, 
                              activate: expired 
                            })}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {expired ? 'Ativar' : 'Desativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedFreight(freight);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Apagar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
                
                {userFreights.length > 5 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setLocation("/freights")}
                  >
                    Ver todos os fretes ({userFreights.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status da Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Status da Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="text-lg font-semibold flex items-center gap-2 mt-1">
                  {hasActiveSubscription ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Ativa
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      Inativa
                    </>
                  )}
                </p>
              </div>
              {subscriptionExpiry && (
                <div className="text-right">
                  <p className="text-sm text-slate-500">Válida até</p>
                  <p className="text-lg font-semibold mt-1">
                    {format(subscriptionExpiry, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>

            {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Assinatura expira em breve
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                    Sua assinatura expira em {daysUntilExpiry} {daysUntilExpiry === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
              </div>
            )}

            {!hasActiveSubscription && (
              <Button 
                className="w-full" 
                onClick={() => setLocation("/checkout")}
              >
                Renovar Assinatura
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Dados do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Seus Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <User className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Nome</p>
                  <p className="font-medium">{user?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Mail className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="font-medium">{user?.email || '-'}</p>
                </div>
              </div>

              {user?.whatsapp && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">WhatsApp</p>
                    <p className="font-medium">{user.whatsapp}</p>
                  </div>
                </div>
              )}

              {user?.createdAt && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Membro desde</p>
                    <p className="font-medium">
                      {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outros Acessos */}
      <Card>
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3"
              onClick={() => setLocation("/freights")}
            >
              <Truck className="h-4 w-4 mr-2" />
              Todos os Fretes
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3"
              onClick={() => setLocation("/drivers")}
            >
              <Users className="h-4 w-4 mr-2" />
              Motoristas
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3"
              onClick={() => setLocation("/vehicles")}
            >
              <Truck className="h-4 w-4 mr-2" />
              Veículos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este frete? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFreight && deleteMutation.mutate(selectedFreight.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
