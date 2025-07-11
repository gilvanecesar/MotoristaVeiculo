import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText, MapPin, Calendar, User, Phone, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface Quote {
  id: number;
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
  active: { label: "Ativo", color: "bg-green-500" },
  closed: { label: "Fechado", color: "bg-blue-500" },
  expired: { label: "Expirado", color: "bg-red-500" },
  pending: { label: "Pendente", color: "bg-yellow-500" },
} as const;

const urgencyConfig = {
  urgent: { label: "Urgente", color: "bg-red-500" },
  high: { label: "Alta", color: "bg-orange-500" },
  medium: { label: "Média", color: "bg-yellow-500" },
  low: { label: "Baixa", color: "bg-green-500" },
} as const;

export default function QuotesPage() {
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
            Gerencie suas solicitações de cotação de transporte
          </p>
        </div>
        <Link href="/quotes/create">
          <Button className="mt-4 sm:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Nova Cotação
          </Button>
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotes?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma cotação encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece criando uma nova cotação.
            </p>
            <div className="mt-6">
              <Link href="/quotes/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Cotação
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          quotes?.map((quote) => (
            <Card key={quote.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold mb-1">
                      {quote.clientName}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Cotação #{quote.id}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`${statusConfig[quote.status as keyof typeof statusConfig]?.color} text-white`}
                    >
                      {statusConfig[quote.status as keyof typeof statusConfig]?.label}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={`${urgencyConfig[quote.urgency as keyof typeof urgencyConfig]?.color} text-white border-0`}
                    >
                      {urgencyConfig[quote.urgency as keyof typeof urgencyConfig]?.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {quote.clientEmail}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {quote.clientPhone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {quote.origin}/{quote.originState} → {quote.destination}/{quote.destinationState}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Entrega: {format(new Date(quote.deliveryDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <strong>Carga:</strong> {quote.cargoType}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Peso:</strong> {quote.weight}kg
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <strong>Volume:</strong> {quote.volume}m³
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      R$ {quote.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Criado em {format(new Date(quote.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}