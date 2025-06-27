import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Eye, Edit, RotateCcw, Calendar, MapPin, MessageSquare, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { FreightWithDestinations, Client } from "@shared/schema";

export default function MyFreightsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedFreight, setSelectedFreight] = useState<FreightWithDestinations | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  console.log("Página Meus Fretes carregando...");

  // Buscar fretes do usuário atual
  const { data: freights = [], isLoading } = useQuery<FreightWithDestinations[]>({
    queryKey: ["/api/freights", "my-freights"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/freights");
      if (!res.ok) throw new Error("Falha ao carregar fretes");
      const allFreights = await res.json();
      
      // Filtrar apenas fretes do usuário atual
      if (user?.profileType === 'driver' || user?.profileType === 'motorista') {
        console.log("Usuário motorista, retornando todos os fretes");
        return allFreights;
      } else {
        console.log("Outro tipo de usuário, retornando todos os fretes");
        return allFreights;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Buscar clientes para mapear os nomes dos clientes aos fretes
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    refetchOnWindowFocus: false,
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

  // Função para verificar se o frete está expirado
  const isExpired = (expirationDate: string | Date | null) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  // Função para formatar data
  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Renderizar badge de status
  const renderStatusBadge = (freight: FreightWithDestinations) => {
    const expired = isExpired(freight.expirationDate);
    
    if (expired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    switch (freight.status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'completed':
        return <Badge variant="secondary">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Aberto</Badge>;
    }
  };

  // Função para verificar autorização
  const isClientAuthorized = (clientId: number | null, freightUserId?: number | null) => {
    if (user?.profileType === 'motorista' || user?.profileType === 'driver') {
      return false;
    }
    
    if (user?.profileType === 'admin' || user?.profileType === 'administrador') {
      return true;
    }
    
    if (freightUserId && user?.id === freightUserId) {
      return true;
    }
    
    if (!freightUserId && user?.clientId === clientId) {
      return true;
    }
    
    return false;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  console.log("Página Meus Fretes carregada com sucesso!");

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Meus Fretes</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Lista dos fretes que você cadastrou no sistema. Você pode reativar fretes expirados para ficarem disponíveis por mais 24 horas.
        </p>
      </div>

      {freights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-slate-500 text-lg mb-2">Nenhum frete encontrado</div>
            <p className="text-slate-400 mb-4">Você ainda não cadastrou nenhum frete.</p>
            <Button onClick={() => setLocation("/freights/new")}>
              Cadastrar Primeiro Frete
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {freights.map((freight) => {
            const client = clients.find(c => c.id === freight.clientId);
            const expired = isExpired(freight.expirationDate);
            const canEdit = isClientAuthorized(freight.clientId, freight.userId);

            return (
              <Card key={freight.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header com ID e Status */}
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Frete #{freight.id}
                        </h3>
                        {renderStatusBadge(freight)}
                      </div>

                      {/* Informações principais */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500">Origem:</p>
                            <p className="text-sm font-medium">{freight.origin}, {freight.originState}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500">Destino:</p>
                            <p className="text-sm font-medium">{freight.destination}, {freight.destinationState}</p>
                            {freight.destination1 && (
                              <p className="text-xs text-blue-600 mt-1">+ {freight.destination1}, {freight.destinationState1}</p>
                            )}
                            {freight.destination2 && (
                              <p className="text-xs text-blue-600 mt-1">+ {freight.destination2}, {freight.destinationState2}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-slate-500 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500">Criado em:</p>
                            <p className="text-sm">{formatDate(freight.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-slate-500 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500">Expira em:</p>
                            <p className="text-sm">{formatDate(freight.expirationDate)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Informações de contato */}
                      {freight.contactName && (
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-slate-500 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500">Contato:</p>
                            <p className="text-sm">{freight.contactName}</p>
                            <p className="text-sm">{freight.contactPhone}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex flex-col gap-2 ml-4">
                      {expired || freight.status === 'expired' ? (
                        <Button
                          size="sm"
                          onClick={() => reactivateFreightMutation.mutate(freight.id)}
                          disabled={reactivateFreightMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reativar
                        </Button>
                      ) : null}

                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/freights/${freight.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFreight(freight);
                          setDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de detalhes */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Detalhes do Frete #{selectedFreight?.id}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDetailsDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedFreight && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500">Origem</h4>
                  <p>{selectedFreight.origin}, {selectedFreight.originState}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500">Destino(s)</h4>
                  <div>
                    <p>{selectedFreight.destination}, {selectedFreight.destinationState}</p>
                    {selectedFreight.destination1 && (
                      <p className="text-sm text-blue-600 mt-1">+ {selectedFreight.destination1}, {selectedFreight.destinationState1}</p>
                    )}
                    {selectedFreight.destination2 && (
                      <p className="text-sm text-blue-600 mt-1">+ {selectedFreight.destination2}, {selectedFreight.destinationState2}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500">Tipo de Carga</h4>
                  <p>{selectedFreight.cargoType === 'completa' ? 'Completa' : 'Complemento'}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500">Peso da Carga</h4>
                  <p>{selectedFreight.cargoWeight} Kg</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500">Valor</h4>
                  <p className="text-lg font-semibold">
                    R$ {selectedFreight.freightValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500">Forma de Pagamento</h4>
                  <p>
                    {(() => {
                      switch (selectedFreight.paymentMethod) {
                        case 'a_vista': return 'À vista';
                        case '30_dias': return '30 dias';
                        case '45_dias': return '45 dias';
                        case '60_dias': return '60 dias';
                        default: return selectedFreight.paymentMethod;
                      }
                    })()}
                  </p>
                </div>
              </div>

              {selectedFreight.observations && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500">Observações</h4>
                  <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded">
                    {selectedFreight.observations}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Botão Fechar no canto inferior direito */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="secondary"
          onClick={() => setLocation("/dashboard")}
          className="shadow-lg"
        >
          Fechar
        </Button>
      </div>
    </div>
  );
}