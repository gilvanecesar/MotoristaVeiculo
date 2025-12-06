import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { FreightWithDestinations, Client, FreightEngagementStats } from "@shared/schema";
import { 
  getVehicleCategory, 
  formatMultipleVehicleTypes, 
  formatMultipleBodyTypes 
} from "@/lib/utils/vehicle-types";
import { CARGO_TYPES, TARP_OPTIONS, TOLL_OPTIONS } from "@shared/schema";
import { formatCurrency } from "@/lib/utils/format";
import { 
  Truck, 
  MapPin, 
  ArrowLeft, 
  Package, 
  DollarSign, 
  Edit, 
  Loader2, 
  AlertCircle,
  Share2,
  Phone,
  MessageSquare,
  Eye,
  BarChart3
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function FreightDetailPage() {
  const [match, params] = useRoute("/freights/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  // Função para verificar autorização baseado no usuário que criou o frete
  const isClientAuthorized = (clientId: number | null, freightUserId?: number | null) => {
    // Motoristas não podem editar/excluir fretes
    if (user?.profileType === 'motorista' || user?.profileType === 'driver') {
      return false;
    }
    
    // Administradores têm acesso total
    if (user?.profileType === 'admin' || user?.profileType === 'administrador') {
      return true;
    }
    
    // Verificação primária: o usuário é o criador do frete?
    if (freightUserId && user?.id === freightUserId) {
      return true;
    }
    
    // Verificação secundária para compatibilidade: cliente associado
    // Se não houver userId no frete, usa a regra do cliente
    if (!freightUserId && user?.clientId === clientId) {
      return true;
    }
    
    return false;
  };
  const freightId = params?.id;
  const viewRecorded = useRef(false);
  
  // Verificar se usuário é admin
  const isAdmin = user?.profileType === 'admin' || user?.profileType === 'administrador';

  // Buscar detalhes do frete
  const { data: freight, isLoading: isLoadingFreight, error } = useQuery<FreightWithDestinations>({
    queryKey: [`/api/freights/${freightId}`],
    enabled: !!freightId,
  });

  // Buscar clientes para exibir o nome do cliente
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Buscar estatísticas de engajamento (apenas para admins)
  const { data: engagementStats } = useQuery<FreightEngagementStats>({
    queryKey: ['/api/admin/freights', freightId, 'engagement'],
    enabled: !!freightId && isAdmin,
  });

  // Registrar visualização do frete (apenas uma vez)
  useEffect(() => {
    if (freightId && !viewRecorded.current) {
      viewRecorded.current = true;
      apiRequest('POST', `/api/freights/${freightId}/engagement`, { eventType: 'view' })
        .catch(err => console.error('Erro ao registrar visualização:', err));
    }
  }, [freightId]);

  // Função para registrar evento de engajamento
  const recordEngagement = async (eventType: 'whatsapp_click' | 'phone_click' | 'share_click') => {
    if (!freightId) return;
    try {
      await apiRequest('POST', `/api/freights/${freightId}/engagement`, { eventType });
    } catch (err) {
      console.error('Erro ao registrar evento:', err);
    }
  };

  // Função para verificar se um frete está expirado
  const isExpired = (expirationDate: string | Date): boolean => {
    return new Date(expirationDate) < new Date();
  };

  // Função para renderizar o badge de status
  const renderStatusBadge = () => {
    if (!freight) return null;
    
    const expired = isExpired(freight.expirationDate);
    
    return (
      <Badge variant={expired ? "destructive" : "default"}>
        {expired ? "Expirado" : "Ativo"}
      </Badge>
    );
  };

  // Função para formatar data
  const formatDate = (dateString: string | Date) => {
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

  // Buscar campanhas ativas para WhatsApp
  const { data: activeCampaigns = [] } = useQuery<Array<{
    id: number;
    name: string;
    randomize: boolean;
    messages: Array<{
      id: number;
      body: string;
      isActive: boolean;
    }>;
  }>>({
    queryKey: ["/api/whatsapp-campaigns/active"],
  });

  // Função para obter mensagem promocional das campanhas ativas
  const getPromoTextFromCampaigns = () => {
    if (!activeCampaigns || activeCampaigns.length === 0) {
      return null;
    }

    // Coletar todas as mensagens ativas de todas as campanhas
    const allActiveMessages: Array<{ campaignName: string; body: string; randomize: boolean }> = [];
    
    for (const campaign of activeCampaigns) {
      const activeMessages = campaign.messages?.filter(m => m.isActive) || [];
      for (const msg of activeMessages) {
        allActiveMessages.push({
          campaignName: campaign.name,
          body: msg.body,
          randomize: campaign.randomize
        });
      }
    }

    if (allActiveMessages.length === 0) {
      return null;
    }

    // Se alguma campanha tem randomize, seleciona aleatoriamente
    const randomIndex = Math.floor(Math.random() * allActiveMessages.length);
    return allActiveMessages[randomIndex];
  };

  // Função para compartilhar via WhatsApp
  const formatWhatsAppMessage = () => {
    if (!freight) return "";
    
    // URL fixa do sistema QUERO FRETES
    const baseUrl = "https://querofretes.com.br";
    // URL específica do frete
    const freightUrl = `${baseUrl}/freights/${freight.id}`;
    
    // Formatação dos destinos
    let destinosText = `🏁 Destino: ${freight.destination} - ${freight.destinationState}, ${freight.destinationState}`;
    
    if (freight.destination1) {
      destinosText += `\n🏁 Destino 2: ${freight.destination1} - ${freight.destinationState1}, ${freight.destinationState1}`;
    }
    
    if (freight.destination2) {
      destinosText += `\n🏁 Destino 3: ${freight.destination2} - ${freight.destinationState2}, ${freight.destinationState2}`;
    }
    
    return encodeURIComponent(`🚛 FRETE DISPONÍVEL 🚛

CLIQUE AQUI PARA VER O FRETE
🔗 Link do frete: ${freightUrl}

📍 Origem: ${freight.origin} - ${freight.originState}, ${freight.originState}
${destinosText}

🚚 Veículo: ${formatMultipleVehicleTypes(freight)}
🚐 Carroceria: ${formatMultipleBodyTypes(freight)}


🌐 Sistema QUERO FRETES: ${baseUrl}`);
  };

  const shareViaWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    recordEngagement('share_click');
    const message = formatWhatsAppMessage();
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Se estiver carregando, mostrar loader
  if (isLoadingFreight) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-slate-500">Carregando detalhes do frete...</p>
        </div>
      </div>
    );
  }

  // Se houver erro ou o frete não existir
  if (error || !freight) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-700 dark:text-red-400">Frete não encontrado</CardTitle>
            </div>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">
              Não foi possível carregar os detalhes deste frete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400">
              O frete solicitado não existe ou você não tem permissão para visualizá-lo.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => navigate("/freights")}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Renderizar detalhes do frete
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/freights")} className="self-start">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {isClientAuthorized(freight.clientId, freight.userId) && (
              <Button 
                variant="outline"
                onClick={() => navigate(`/freights/direct-edit/${freight.id}`)}
                className="text-sm"
              >
                <Edit className="h-4 w-4 mr-2" /> Editar Valor
              </Button>
            )}
            
            <Button 
              variant="default"
              onClick={shareViaWhatsApp}
              className="text-sm"
            >
              <Share2 className="h-4 w-4 mr-2" /> Compartilhar
            </Button>
          </div>
        </div>
        
        {/* Estatísticas de Engajamento (apenas para admins) */}
        {isAdmin && engagementStats && (
          <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-base text-blue-900 dark:text-blue-100">Estatísticas de Engajamento</CardTitle>
              </div>
              <CardDescription className="text-blue-700/70 dark:text-blue-300/70">
                Métricas de interação com este frete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs font-medium">Visualizações</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{engagementStats.totalViews}</p>
                  <p className="text-xs text-slate-500">{engagementStats.uniqueViews} únicas</p>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                    <FaWhatsapp className="h-4 w-4" />
                    <span className="text-xs font-medium">WhatsApp</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{engagementStats.whatsappClicks}</p>
                  <p className="text-xs text-slate-500">cliques</p>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <Phone className="h-4 w-4" />
                    <span className="text-xs font-medium">Telefone</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{engagementStats.phoneClicks}</p>
                  <p className="text-xs text-slate-500">cliques</p>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                    <Share2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Compartilhamentos</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{engagementStats.shareClicks}</p>
                  <p className="text-xs text-slate-500">cliques</p>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs font-medium">Interações</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {engagementStats.whatsappClicks + engagementStats.phoneClicks + engagementStats.shareClicks}
                  </p>
                  <p className="text-xs text-slate-500">total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Card principal */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    Frete {renderStatusBadge()}
                  </h2>
                  <p className="text-slate-500 text-sm sm:text-base">
                    {clients.find((client: Client) => client.id === freight.clientId)?.name || "Cliente não encontrado"}
                  </p>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-primary self-start sm:self-center">
                {formatCurrency(freight.freightValue)}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* Origem e Destinos */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-md dark:bg-slate-800">
                    <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-700 dark:text-slate-300">Origem</h3>
                    <p className="text-base sm:text-lg">{freight.origin}, {freight.originState}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-md dark:bg-slate-800">
                    <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-700 dark:text-slate-300">Destino Principal</h3>
                    <p className="text-base sm:text-lg">{freight.destination}, {freight.destinationState}</p>
                  </div>
                </div>

                {/* Destinos Adicionais */}
                {(freight.destination1 || freight.destination2) && (
                  <div className="space-y-3">
                    {freight.destination1 && (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        <div className="p-1.5 bg-slate-200 rounded-md dark:bg-slate-700">
                          <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Destino 2</h4>
                          <p className="text-sm sm:text-base">{freight.destination1}, {freight.destinationState1}</p>
                        </div>
                      </div>
                    )}
                    
                    {freight.destination2 && (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        <div className="p-1.5 bg-slate-200 rounded-md dark:bg-slate-700">
                          <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Destino 3</h4>
                          <p className="text-sm sm:text-base">{freight.destination2}, {freight.destinationState2}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Informações do Veículo */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-md dark:bg-slate-800">
                    <Truck className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-700 dark:text-slate-300">Tipo de Veículo</h3>
                    <p>{formatMultipleVehicleTypes(freight)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-md dark:bg-slate-800">
                    <Package className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-700 dark:text-slate-300">Tipo de Carroceria</h3>
                    <p>{formatMultipleBodyTypes(freight)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Informações da Carga */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Informações da Carga</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Tipo de Carga</h4>
                  <p>{CARGO_TYPES[freight.cargoType] || freight.cargoType}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Tipo de Produto</h4>
                  <p>{freight.productType || "Não especificado"}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Peso</h4>
                  <p>{freight.cargoWeight} Kg</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Lona</h4>
                  <p>{TARP_OPTIONS[freight.needsTarp] || freight.needsTarp}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Pedágio</h4>
                  <p>{TOLL_OPTIONS[freight.tollOption] || freight.tollOption}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Forma de Pagamento</h4>
                  <p>{freight.paymentMethod}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Informações de Contato */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Informações de Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Nome</h4>
                  <p>{freight.contactName}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Telefone</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p>{freight.contactPhone}</p>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => {
                        recordEngagement('phone_click');
                        window.open(`tel:+55${freight.contactPhone.replace(/\D/g, '')}`, '_self');
                      }}
                    >
                      <Phone className="h-4 w-4 text-blue-500" />
                      <span>Ligar</span>
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => {
                        recordEngagement('whatsapp_click');
                        window.open(`https://wa.me/55${freight.contactPhone.replace(/\D/g, '')}`, '_blank');
                      }}
                    >
                      <FaWhatsapp className="h-4 w-4 text-green-500" />
                      <span>WhatsApp</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Observações, se existirem */}
            {freight.observations && (
              <>
                <Separator className="my-6" />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Observações</h3>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">{freight.observations}</p>
                </div>
              </>
            )}
            
            {/* Destinos intermediários, se existirem */}
            {freight.destinations && freight.destinations.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Destinos Intermediários</h3>
                  <div className="space-y-3">
                    {freight.destinations.map((destination) => (
                      <div key={destination.id} className="border-b border-slate-200 dark:border-slate-700 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-slate-500 mt-0.5" />
                          <div>
                            <span className="font-medium">{destination.destination}, {destination.destinationState}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => navigate("/freights")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline"
                onClick={() => {
                  recordEngagement('phone_click');
                  window.open(`tel:+55${freight.contactPhone.replace(/\D/g, '')}`, '_self');
                }}
                className="gap-2"
              >
                <Phone className="h-4 w-4 text-blue-500" />
                Ligar
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  recordEngagement('whatsapp_click');
                  window.open(`https://wa.me/55${freight.contactPhone.replace(/\D/g, '')}`, '_blank');
                }}
                className="gap-2"
              >
                <FaWhatsapp className="h-4 w-4 text-green-500" />
                WhatsApp
              </Button>
              
              <Button onClick={shareViaWhatsApp}>
                <Share2 className="h-4 w-4 mr-2" /> Compartilhar
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}