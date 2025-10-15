import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Search, 
  MessageCircle, 
  Calendar,
  User,
  MapPin,
  DollarSign,
  Clock,
  TrendingUp,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const statusColors = {
  "ativa": "bg-green-100 text-green-800",
  "fechada": "bg-blue-100 text-blue-800",
  "cancelada": "bg-red-100 text-red-800",
  "expirada": "bg-gray-100 text-gray-800",
  "pendente": "bg-yellow-100 text-yellow-800"
};

const urgencyColors = {
  "baixa": "bg-green-100 text-green-800",
  "media": "bg-yellow-100 text-yellow-800",
  "alta": "bg-orange-100 text-orange-800",
  "urgente": "bg-red-100 text-red-800",
  "low": "bg-green-100 text-green-800",
  "medium": "bg-yellow-100 text-yellow-800",
  "high": "bg-orange-100 text-orange-800",
  "urgent": "bg-red-100 text-red-800"
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
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

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<QuoteStats>({
    queryKey: ["/api/quotes/stats"],
  });

  // Filtrar cotações
  const filteredQuotes = quotes?.filter((quote: Quote) => {
    const matchesSearch = 
      quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.cargoType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const openWhatsApp = (quote: Quote) => {
    const phone = quote.clientPhone.replace(/\D/g, '');
    const message = generateWhatsAppMessage(quote);
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatCurrency = (value: number | string | null) => {
    const numValue = value ? Number(value) : 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const isLoading = quotesLoading || statsLoading;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cotações</h1>
          <p className="text-sm md:text-base text-gray-600">Visualize as solicitações de cotação de transporte</p>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 md:pb-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <FileText className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                <span className="text-xl md:text-2xl font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Ativas</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 md:pb-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                <span className="text-xl md:text-2xl font-bold">{stats.active}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Fechadas</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 md:pb-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <User className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                <span className="text-xl md:text-2xl font-bold">{stats.closed}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Este Mês</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 md:pb-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                <span className="text-xl md:text-2xl font-bold">{stats.thisMonth}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Pesquisar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Pesquisar por cliente, email, origem, destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-quotes"
                />
              </div>
            </div>

            <div className="w-full sm:w-64">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="fechada">Fechada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="expirada">Expirada</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de cotações */}
      <Card>
        <CardHeader>
          <CardTitle>Cotações ({filteredQuotes?.length || 0})</CardTitle>
          <CardDescription>
            Todas as cotações disponíveis para você
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando cotações...</p>
            </div>
          ) : filteredQuotes?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma cotação encontrada</p>
            </div>
          ) : isMobile ? (
            <div className="space-y-4">
              {filteredQuotes?.map((quote: Quote) => (
                <Card key={quote.id} data-testid={`card-quote-${quote.id}`} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{quote.clientName}</p>
                        <p className="text-xs text-gray-500 truncate">{quote.clientEmail}</p>
                        <p className="text-xs text-gray-500">{quote.clientPhone}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end flex-shrink-0">
                        <Badge className={statusColors[quote.status as keyof typeof statusColors]}>
                          {quote.status}
                        </Badge>
                        <Badge variant={quote.userId ? "default" : "secondary"} className="text-xs">
                          {quote.userId ? "Registrado" : "Público"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Origem</p>
                          <p className="text-sm font-medium">{quote.origin} - {quote.originState}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Destino</p>
                          <p className="text-sm font-medium">{quote.destination} - {quote.destinationState}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tipo de Carga</p>
                        <p className="text-sm font-medium">{quote.cargoType}</p>
                        <p className="text-xs text-gray-600">{quote.weight}kg | {quote.volume}m³</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Valor de NF</p>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">{formatCurrency(quote.price)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Urgência</p>
                        <Badge className={urgencyColors[quote.urgency as keyof typeof urgencyColors]}>
                          {quote.urgency}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Data de Entrega</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(quote.deliveryDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-1">Criada em</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">
                          {format(new Date(quote.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => openWhatsApp(quote)}
                      data-testid={`button-whatsapp-${quote.id}`}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" /> Contatar Cliente
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Origem → Destino</TableHead>
                    <TableHead>Carga</TableHead>
                    <TableHead>Valor de NF</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Urgência</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes?.map((quote: Quote) => (
                    <TableRow key={quote.id} data-testid={`row-quote-${quote.id}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{quote.clientName}</p>
                          <p className="text-sm text-gray-600">{quote.clientEmail}</p>
                          <p className="text-sm text-gray-600">{quote.clientPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{quote.origin} - {quote.originState}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{quote.destination} - {quote.destinationState}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{quote.cargoType}</p>
                          <p className="text-sm text-gray-600">{quote.weight}kg</p>
                          <p className="text-sm text-gray-600">{quote.volume}m³</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{formatCurrency(quote.price)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[quote.status as keyof typeof statusColors]}>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={urgencyColors[quote.urgency as keyof typeof urgencyColors]}>
                          {quote.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={quote.userId ? "default" : "secondary"}>
                          {quote.userId ? "Registrado" : "Público"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {format(new Date(quote.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {format(new Date(quote.deliveryDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWhatsApp(quote)}
                          data-testid={`button-whatsapp-${quote.id}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
