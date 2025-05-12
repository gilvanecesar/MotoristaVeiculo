import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Check, 
  X, 
  ArrowLeft,
  AlertTriangle,
  Clock,
  BarChart,
  ArrowUpDown
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Tipo para histórico de assinatura
type SubscriptionEvent = {
  id: number;
  userId: number;
  eventType: string;
  eventDate: string;
  planType: string;
  details: string;
};

export default function SubscriptionHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Buscar histórico de assinatura
  const { 
    data: events, 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['/api/user/subscription-history'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user/subscription-history');
        const data = await res.json();
        return data.events as SubscriptionEvent[];
      } catch (err) {
        // Retornar um array vazio para permitir a renderização sem erro
        return [];
      }
    }
  });
  
  // Formatar data
  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt });
    } catch (err) {
      return "Data inválida";
    }
  };
  
  // Obter descrição do tipo de evento
  const getEventDescription = (eventType: string) => {
    switch (eventType) {
      case "subscription_created":
        return "Assinatura iniciada";
      case "subscription_updated":
        return "Assinatura atualizada";
      case "subscription_canceled":
        return "Assinatura cancelada";
      case "subscription_reactivated":
        return "Assinatura reativada";
      case "payment_success":
        return "Pagamento bem-sucedido";
      case "payment_failed":
        return "Falha no pagamento";
      case "trial_started":
        return "Período de teste iniciado";
      case "trial_ended":
        return "Período de teste encerrado";
      case "plan_changed":
        return "Plano alterado";
      default:
        return eventType;
    }
  };
  
  // Obter cor do badge de acordo com o tipo de evento
  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case "subscription_created":
      case "subscription_reactivated":
      case "payment_success":
      case "trial_started":
        return "bg-green-50 text-green-700 hover:bg-green-50";
      case "subscription_updated":
      case "plan_changed":
        return "bg-blue-50 text-blue-700 hover:bg-blue-50";
      case "subscription_canceled":
      case "payment_failed":
      case "trial_ended":
        return "bg-red-50 text-red-700 hover:bg-red-50";
      default:
        return "bg-gray-50 text-gray-700 hover:bg-gray-50";
    }
  };
  
  // Função para obter nome do plano formatado
  const getPlanTypeName = (planType: string) => {
    switch (planType) {
      case "monthly":
        return "Mensal";
      case "annual":
        return "Anual";
      case "trial":
        return "Período de Teste";
      default:
        return planType;
    }
  };
  
  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar histórico</AlertTitle>
          <AlertDescription>
            Não foi possível carregar seu histórico de assinatura. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
        
        <Button variant="outline" asChild className="mb-6">
          <Link href="/subscribe">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para gerenciamento de assinatura
          </Link>
        </Button>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Skeleton className="h-10 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
        </div>
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Histórico da Assinatura</h1>
          <p className="text-muted-foreground">Veja o histórico completo da sua assinatura</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href="/subscribe">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Verificação de dados de histórico */}
      {!events || events.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum evento encontrado</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Não foram encontrados eventos em seu histórico de assinatura. Eles aparecerão aqui após mudanças na sua assinatura.
              </p>
              
              <Button asChild>
                <Link href="/subscribe">
                  Gerenciar Assinatura
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Eventos da Assinatura</CardTitle>
            <CardDescription>Eventos relacionados à sua assinatura no QUERO FRETES</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <span>Data</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(event.eventDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getEventBadgeColor(event.eventType)}>
                          {getEventDescription(event.eventType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPlanTypeName(event.planType)}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {event.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Status visual da assinatura - Timeline */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">Status da Assinatura</h2>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
          
          {/* Status Atual */}
          <div className="relative mb-6 pl-14 pb-2">
            <div className="absolute left-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Status Atual</p>
              <p className="text-muted-foreground text-sm">
                Sua assinatura está {user?.subscriptionActive ? 'ativa' : 'inativa'}.
                {user?.subscriptionType && ` Plano: ${getPlanTypeName(user.subscriptionType)}`}
              </p>
            </div>
          </div>
          
          {/* Status da Assinatura atual */}
          <div className="relative mb-6 pl-14 pb-2">
            <div className="absolute left-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Data de Expiração</p>
              <p className="text-muted-foreground text-sm">
                {user?.subscriptionExpiresAt
                  ? `Sua assinatura expira em ${formatDate(user.subscriptionExpiresAt)}`
                  : 'Nenhuma data de expiração disponível.'}
              </p>
            </div>
          </div>
          
          {/* Mais informações */}
          <div className="relative pl-14">
            <div className="absolute left-0 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <p className="font-medium">Informações Adicionais</p>
              <p className="text-muted-foreground text-sm">
                Para mais detalhes sobre sua assinatura ou para resolver problemas,
                entre em contato com nosso suporte: suporte@querofretes.com.br
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}