import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FileText, MapPin, Calendar, User, Phone, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

interface Quote {
  id: number;
  userId: number | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  origin: string;
  originState: string;
  destination: string;
  destinationState: string;
  cargoType: string;
  weight: number;
  volume: number;
  urgency: string;
  deliveryDate: string;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

interface QuoteStats {
  total: number;
  active: number;
  closed: number;
  expired: number;
  thisMonth: number;
  lastMonth: number;
}

const statusConfig = {
  ativa: { label: "Ativa", color: "bg-green-500" },
  pendente: { label: "Pendente", color: "bg-yellow-500" },
  fechada: { label: "Fechada", color: "bg-blue-500" },
  expirada: { label: "Expirada", color: "bg-red-500" },
} as const;

const urgencyConfig = {
  urgent: { label: "Urgente", color: "bg-red-500" },
  high: { label: "Alta", color: "bg-orange-500" },
  medium: { label: "Média", color: "bg-yellow-500" },
  low: { label: "Baixa", color: "bg-green-500" },
} as const;

// Função para verificar se uma cotação expirou
const isQuoteExpired = (quote: Quote): boolean => {
  if (!quote.expiresAt) return false;
  return new Date(quote.expiresAt) < new Date();
};

// Função para obter o status efetivo da cotação
const getEffectiveStatus = (quote: Quote): string => {
  if (isQuoteExpired(quote)) {
    return 'expirada';
  }
  return quote.status;
};

// Função para gerar mensagem personalizada do WhatsApp
const generateWhatsAppMessage = (quote: Quote): string => {
  const message = `Olá ${quote.clientName}! 👋

Recebemos seu pedido de cotação através da plataforma QUERO FRETES e gostaríamos de fazer contato para apresentar nossa proposta.

📋 *Detalhes da sua cotação:*
• *Rota:* ${quote.origin}/${quote.originState} → ${quote.destination}/${quote.destinationState}
• *Carga:* ${quote.cargoType}
• *Peso:* ${quote.weight}kg | *Volume:* ${quote.volume}m³
• *Entrega:* ${format(new Date(quote.deliveryDate), "dd/MM/yyyy", { locale: ptBR })}

Temos uma excelente proposta para atender suas necessidades de transporte. Quando seria um bom momento para conversarmos?

Aguardo seu retorno! 🚛`;
  
  return message;
};

export default function QuotesPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Verificar se o usuário é transportador, embarcador, agenciador ou administrador
  if (!user || (
    user.profileType !== "carrier" && 
    user.profileType !== "transportador" && 
    user.profileType !== "transportadora" &&
    user.profileType !== "shipper" && 
    user.profileType !== "embarcador" &&
    user.profileType !== "agenciador" &&
    user.profileType !== "administrador"
  )) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Acesso Restrito
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Apenas transportadores, embarcadores, agenciadores e administradores têm acesso às cotações.
          </p>
        </div>
      </div>
    );
  }

  const { data: quotes, isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<QuoteStats>({
    queryKey: ["/api/quotes/stats"],
  });

  if (quotesLoading || statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-40 mt-4 sm:mt-0" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cotações
          </h1>
          <p className="text-gray-600">
            Visualize as solicitações de cotação de transporte
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className={`grid gap-4 mb-8 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6'}`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total
            </CardTitle>
            <div className="text-2xl font-bold">
              {stats?.total || 0}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Ativas
            </CardTitle>
            <div className="text-2xl font-bold text-green-600">
              {stats?.active || 0}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Fechadas
            </CardTitle>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.closed || 0}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Expiradas
            </CardTitle>
            <div className="text-2xl font-bold text-red-600">
              {stats?.expired || 0}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Este Mês
            </CardTitle>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.thisMonth || 0}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Mês Passado
            </CardTitle>
            <div className="text-2xl font-bold text-gray-600">
              {stats?.lastMonth || 0}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Lista de Cotações */}
      <div className={isMobile ? "grid grid-cols-1 gap-4" : "space-y-4"}>
        {quotes?.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma cotação encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Aguarde novas solicitações de cotação.
            </p>
          </div>
        ) : (
          quotes?.map((quote) => {
            const effectiveStatus = getEffectiveStatus(quote);
            const isExpired = isQuoteExpired(quote);
            
            return (
              <Card key={quote.id} className={`hover:shadow-lg transition-shadow ${isMobile ? 'border-l-4 border-l-primary' : ''}`}>
                <CardContent className={isMobile ? "p-4" : "p-6"}>
                  {isMobile ? (
                    /* Layout Mobile - Card Compacto */
                    <div className="space-y-3">
                      {/* Header do Card Mobile */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-base">
                            {quote.clientName}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {quote.clientEmail}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant="secondary" 
                            className={`${statusConfig[effectiveStatus as keyof typeof statusConfig]?.color} text-white text-xs`}
                          >
                            {statusConfig[effectiveStatus as keyof typeof statusConfig]?.label}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={`${urgencyConfig[quote.urgency as keyof typeof urgencyConfig]?.color} text-white border-0 text-xs`}
                          >
                            {urgencyConfig[quote.urgency as keyof typeof urgencyConfig]?.label}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Rota */}
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {quote.origin}/{quote.originState} → {quote.destination}/{quote.destinationState}
                        </span>
                      </div>
                      
                      {/* Informações da Carga */}
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Carga:</span>
                            <p className="font-medium text-gray-900 truncate">{quote.cargoType}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Peso/Volume:</span>
                            <p className="font-medium text-gray-900">{quote.weight}kg | {quote.volume}m³</p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Entrega: {format(new Date(quote.deliveryDate), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer do Card Mobile */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          <a 
                            href={`https://wa.me/55${quote.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(generateWhatsAppMessage(quote))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>WhatsApp</span>
                          </a>
                          <Badge 
                            variant="outline"
                            className={quote.userId === null ? "bg-orange-500 text-white border-0" : "bg-blue-500 text-white border-0"}
                          >
                            {quote.userId === null ? "Pública" : "Registrada"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            R$ {quote.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-gray-500">
                            #{quote.id} - {format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Expiração */}
                      {quote.expiresAt && (
                        <div className={`text-xs text-center p-2 rounded ${isExpired ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                          {isExpired ? 'Expirou em: ' : 'Expira em: '}
                          {format(new Date(quote.expiresAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Layout Desktop - Card Expandido */
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      {/* Informações do Cliente */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {quote.clientName}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={`${statusConfig[effectiveStatus as keyof typeof statusConfig]?.color} text-white`}
                          >
                            {statusConfig[effectiveStatus as keyof typeof statusConfig]?.label}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={`${urgencyConfig[quote.urgency as keyof typeof urgencyConfig]?.color} text-white border-0`}
                          >
                            {urgencyConfig[quote.urgency as keyof typeof urgencyConfig]?.label}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={quote.userId === null ? "bg-orange-500 text-white border-0" : "bg-blue-500 text-white border-0"}
                          >
                            {quote.userId === null ? "Pública" : "Registrada"}
                          </Badge>
                        </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            {quote.clientEmail}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            <span className="mr-2">{quote.clientPhone}</span>
                            <a 
                              href={`https://wa.me/55${quote.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(generateWhatsAppMessage(quote))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 hover:scale-110 transition-transform"
                              title="Enviar mensagem no WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {quote.origin}/{quote.originState} → {quote.destination}/{quote.destinationState}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Entrega: {format(new Date(quote.deliveryDate), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          <div className="text-gray-600">
                            <strong>Carga:</strong> {quote.cargoType}
                          </div>
                          <div className="text-gray-600">
                            <strong>Peso:</strong> {quote.weight}kg | <strong>Volume:</strong> {quote.volume}m³
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Preço e Data */}
                    <div className="flex flex-col items-end text-right">
                      <div className="text-lg font-bold text-green-600 mb-2">
                        <span className="text-sm text-gray-600 font-normal">Valor de NF:</span><br />
                        R$ {quote.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500">
                        Cotação #{quote.id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(quote.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                      {quote.expiresAt && (
                        <div className={`text-xs mt-1 ${isExpired ? 'text-red-500 font-semibold' : 'text-orange-500'}`}>
                          {isExpired ? 'Expirou em: ' : 'Expira em: '}
                          {format(new Date(quote.expiresAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}