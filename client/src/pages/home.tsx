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
  X
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
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
  
  // Calcular totais de visualizações e motoristas interessados
  const totalViews = userFreights.reduce((sum, f) => sum + (f.views || 0), 0);
  const totalInterestedDrivers = userFreights.reduce((sum, f) => sum + (f.interestedDrivers || 0), 0);

  // Mutation para deletar múltiplos fretes
  const deleteMultipleMutation = useMutation({
    mutationFn: async (freightIds: number[]) => {
      await Promise.all(
        freightIds.map(id => apiRequest('DELETE', `/api/freights/${id}`))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
      toast({
        title: "Fretes excluídos",
        description: `${selectedFreights.length} ${selectedFreights.length === 1 ? 'frete excluído' : 'fretes excluídos'} com sucesso.`,
      });
      setDeleteDialogOpen(false);
      setSelectedFreights([]);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir os fretes.",
        variant: "destructive",
      });
    },
  });

  // Mutation para ativar/desativar múltiplos fretes
  const toggleMultipleMutation = useMutation({
    mutationFn: async ({ freightIds, activate }: { freightIds: number[]; activate: boolean }) => {
      const expirationDate = activate 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : new Date().toISOString();
      
      await Promise.all(
        freightIds.map(id => apiRequest('PATCH', `/api/freights/${id}`, { expirationDate }))
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
      toast({
        title: variables.activate ? "Fretes ativados" : "Fretes desativados",
        description: `${selectedFreights.length} ${selectedFreights.length === 1 ? 'frete' : 'fretes'} ${variables.activate ? 'ativado(s)' : 'desativado(s)'}.`,
      });
      setSelectedFreights([]);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os fretes.",
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

  // Verificar se todos os fretes selecionados estão expirados ou ativos
  const allSelectedExpired = selectedFreights.every(id => {
    const freight = userFreights.find(f => f.id === id);
    return freight && isFreightExpired(freight);
  });

  const handleBulkEdit = () => {
    if (selectedFreights.length === 1) {
      setLocation(`/freights/${selectedFreights[0]}/edit`);
    } else {
      toast({
        title: "Seleção múltipla",
        description: "Selecione apenas um frete para editar.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-bold">Painel de Controle</h1>
        <p className="text-xs md:text-base text-slate-500 mt-1">Acompanhe a performance dos seus fretes</p>
      </div>

      {/* Métricas em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Fretes Postados */}
        <Card>
          <CardHeader className="pb-3 p-3 md:p-6 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-500">
                Fretes postados
              </CardTitle>
              <Package className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-2xl md:text-3xl font-bold">{userFreights.length}</div>
            <p className="text-[10px] md:text-xs text-slate-500 mt-1">
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
          <CardHeader className="pb-3 p-3 md:p-6 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-500">
                Visualizações
              </CardTitle>
              <Eye className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-2xl md:text-3xl font-bold">{totalViews}</div>
            <p className="text-[10px] md:text-xs text-slate-500 mt-1">
              {userFreights.length > 0 ? `Média de ${Math.round(totalViews / userFreights.length)} por frete` : 'Nenhum frete'}
            </p>
          </CardContent>
        </Card>

        {/* Motoristas Interessados */}
        <Card>
          <CardHeader className="pb-3 p-3 md:p-6 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-500">
                Motoristas interessados
              </CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-2xl md:text-3xl font-bold">{totalInterestedDrivers}</div>
            <p className="text-[10px] md:text-xs text-slate-500 mt-1">
              {userFreights.length > 0 ? `Média de ${Math.round(totalInterestedDrivers / userFreights.length)} por frete` : 'Nenhum frete'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Fretes Ativos - Layout de Tabela */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Truck className="h-4 w-4 md:h-5 md:w-5" />
                  Seus Fretes
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {activeFreights > 0 
                    ? `${activeFreights} ${activeFreights === 1 ? 'frete ativo' : 'fretes ativos'}` 
                    : 'Nenhum frete ativo'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            {userFreights.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <Truck className="h-10 w-10 md:h-12 md:w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm md:text-base text-slate-500 mb-4">Nenhum frete postado ainda</p>
                <Button onClick={() => setLocation("/freights/new")} className="text-sm">
                  Criar frete
                </Button>
              </div>
            ) : (
              <>
                {/* Menu de ações em massa */}
                {selectedFreights.length > 0 && (
                  <div className="mb-3 md:mb-4 flex flex-col md:flex-row items-start md:items-center gap-2 p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedFreights.length === userFreights.length}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="text-xs md:text-sm font-medium">
                        {selectedFreights.length} selecionado{selectedFreights.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 w-full md:w-auto md:ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMultipleMutation.mutate({ 
                          freightIds: selectedFreights, 
                          activate: allSelectedExpired 
                        })}
                        disabled={toggleMultipleMutation.isPending}
                        className="text-xs md:text-sm h-8"
                      >
                        <Power className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        {allSelectedExpired ? 'Ativar' : 'Desativar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBulkEdit}
                        className="text-xs md:text-sm h-8"
                      >
                        <Pencil className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs md:text-sm h-8"
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Excluir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFreights([])}
                        className="text-xs md:text-sm h-8"
                      >
                        <X className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Limpar
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {userFreights.slice(0, 5).map((freight) => {
                    const expired = isFreightExpired(freight);
                    const isSelected = selectedFreights.includes(freight.id);
                    
                    if (isMobile) {
                      // Layout Mobile - Card Vertical
                      return (
                        <div 
                          key={freight.id} 
                          className={`
                            p-3 border rounded-lg transition-colors
                            ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                          `}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelectFreight(freight.id)}
                              />
                              <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                                expired 
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {expired ? 'Expirado' : 'Ativo'}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-bold text-primary">{formatCurrency(freight.freightValue)}</p>
                              <p className="text-[10px] text-slate-500">{freight.paymentMethod}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5 pl-7">
                            <div>
                              <p className="text-[10px] text-slate-500">Origem</p>
                              <p className="text-sm font-medium">{freight.origin}, {freight.originState}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500">Destino</p>
                              <p className="text-sm font-medium">{freight.destination}, {freight.destinationState}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Layout Desktop - Horizontal
                    return (
                      <div 
                        key={freight.id} 
                        className={`
                          flex items-center gap-4 p-3 border rounded-lg transition-colors
                          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                        `}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectFreight(freight.id)}
                        />

                        <div className="min-w-[140px]">
                          <p className="text-xs text-slate-500">Origem</p>
                          <p className="text-sm font-medium">{freight.origin}, {freight.originState}</p>
                        </div>

                        <div className="flex-1 min-w-[140px]">
                          <p className="text-xs text-slate-500">Destino</p>
                          <p className="text-sm font-medium">{freight.destination}, {freight.destinationState}</p>
                        </div>

                        <div className="hidden lg:block min-w-[100px]">
                          <p className="text-xs text-slate-500">Tipo</p>
                          <p className="text-sm font-medium">
                            {freight.cargoType === 'completa' ? 'Completa' : 'Complemento'}
                          </p>
                        </div>

                        <div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            expired 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {expired ? 'Expirado' : 'Ativo'}
                          </span>
                        </div>

                        <div className="text-right min-w-[110px]">
                          <p className="text-lg font-bold text-primary">{formatCurrency(freight.freightValue)}</p>
                          <p className="text-xs text-slate-500">{freight.paymentMethod}</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {userFreights.length > 5 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-3 md:mt-4 text-sm"
                      onClick={() => setLocation("/freights")}
                    >
                      Ver todos os fretes ({userFreights.length})
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Status da Assinatura */}
        <Card>
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
              Status da Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6 pt-0">
            <div className="flex items-center justify-between p-3 md:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <p className="text-xs md:text-sm text-slate-500">Status</p>
                <p className="text-base md:text-lg font-semibold flex items-center gap-2 mt-1">
                  {hasActiveSubscription ? (
                    <>
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                      Ativa
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                      Inativa
                    </>
                  )}
                </p>
              </div>
              {subscriptionExpiry && (
                <div className="text-right">
                  <p className="text-xs md:text-sm text-slate-500">Válida até</p>
                  <p className="text-base md:text-lg font-semibold mt-1">
                    {format(subscriptionExpiry, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>

            {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
              <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-orange-800 dark:text-orange-200">
                    Assinatura expira em breve
                  </p>
                  <p className="text-[10px] md:text-xs text-orange-600 dark:text-orange-300 mt-1">
                    Sua assinatura expira em {daysUntilExpiry} {daysUntilExpiry === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
              </div>
            )}

            {!hasActiveSubscription && (
              <Button 
                className="w-full text-sm" 
                onClick={() => setLocation("/checkout")}
              >
                Renovar Assinatura
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Dados do Usuário */}
        <Card>
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <User className="h-4 w-4 md:h-5 md:w-5" />
              Seus Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <User className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500">Nome</p>
                  <p className="text-sm md:text-base font-medium">{user?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500">Email</p>
                  <p className="text-sm md:text-base font-medium">{user?.email || '-'}</p>
                </div>
              </div>

              {user?.whatsapp && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Phone className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                  <div>
                    <p className="text-[10px] md:text-xs text-slate-500">WhatsApp</p>
                    <p className="text-sm md:text-base font-medium">{user.whatsapp}</p>
                  </div>
                </div>
              )}

              {user?.createdAt && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                  <div>
                    <p className="text-[10px] md:text-xs text-slate-500">Membro desde</p>
                    <p className="text-sm md:text-base font-medium">
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
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-base md:text-lg">Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-2 md:py-3 text-sm"
              onClick={() => setLocation("/freights")}
            >
              <Truck className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              Todos os Fretes
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto py-2 md:py-3 text-sm"
              onClick={() => setLocation("/drivers")}
            >
              <Users className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              Motoristas
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto py-2 md:py-3 text-sm"
              onClick={() => setLocation("/vehicles")}
            >
              <Truck className="h-3 w-3 md:h-4 md:w-4 mr-2" />
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
              Tem certeza que deseja excluir {selectedFreights.length === 1 ? 'este frete' : `estes ${selectedFreights.length} fretes`}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedFreights([])}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMultipleMutation.mutate(selectedFreights)}
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
