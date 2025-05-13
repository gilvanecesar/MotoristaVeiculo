import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
import { format } from "date-fns";
import { pt } from "date-fns/locale";
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
import { Badge } from "@/components/ui/badge";

export default function SubscriptionHistoryPage() {
  const { user } = useAuth();
  
  // Dados do histórico usando apenas os dados disponíveis no objeto do usuário
  const events = user ? [
    {
      id: 1,
      type: 'subscription_created',
      createdAt: user.createdAt,
      metadata: {
        planType: user.subscriptionType || 'mensal',
      }
    },
    {
      id: 2,
      type: 'subscription_activated',
      createdAt: user.createdAt,
      metadata: {
        planType: user.subscriptionType || 'mensal',
        startDate: user.createdAt,
        endDate: user.subscriptionExpiresAt
      }
    }
  ] : [];
  
  // Tradução dos tipos de eventos para exibição
  const eventTypeMap: Record<string, string> = {
    'subscription_created': 'Assinatura criada',
    'subscription_activated': 'Assinatura ativada',
    'payment_received': 'Pagamento recebido',
    'subscription_cancelled': 'Assinatura cancelada',
    'trial_activated': 'Período de teste ativado',
    'trial_ended': 'Período de teste encerrado',
    'subscription_renewed': 'Assinatura renovada',
    'payment_method_updated': 'Método de pagamento atualizado',
  };
  
  // Formatar data
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'Data não disponível';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: pt });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  // Renderizar ícone baseado no tipo de evento
  const renderEventIcon = (type: string) => {
    switch (type) {
      case 'subscription_created':
      case 'subscription_activated':
      case 'payment_received':
      case 'subscription_renewed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'subscription_cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      case 'trial_activated':
      case 'trial_ended':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Calendar className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  // Verificar status atual da assinatura
  const subscriptionActive = user?.subscriptionActive || false;
  const isTrial = user?.subscriptionType === 'trial';
  const expiresAt = user?.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
  
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
      
      {/* Status atual da assinatura */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Status Atual</CardTitle>
          <CardDescription>Status atual da sua assinatura no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            {subscriptionActive ? (
              isTrial ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                  Período de Teste
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                  Assinatura Ativa
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
                Sem Assinatura Ativa
              </Badge>
            )}
            
            {user?.subscriptionType && (
              <Badge variant="outline">
                Plano {user.subscriptionType === 'monthly' || user.subscriptionType === 'mensal' 
                  ? 'Mensal' 
                  : user.subscriptionType === 'annual' || user.subscriptionType === 'anual' 
                  ? 'Anual' 
                  : user.subscriptionType === 'trial' 
                  ? 'Teste Gratuito' 
                  : user.subscriptionType}
              </Badge>
            )}
          </div>
          
          {expiresAt && (
            <div className="text-sm text-muted-foreground">
              {subscriptionActive 
                ? `Expira em: ${formatDate(expiresAt)}` 
                : `Expirou em: ${formatDate(expiresAt)}`}
            </div>
          )}
        </CardContent>
      </Card>
      
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
                        Data <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {formatDate(event.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {renderEventIcon(event.type)}
                          <span>{eventTypeMap[event.type] || event.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {event.type === 'subscription_created' && (
                            <span>
                              Plano: {event.metadata?.planType === 'monthly' || event.metadata?.planType === 'mensal' 
                                ? 'Mensal' 
                                : event.metadata?.planType === 'annual' || event.metadata?.planType === 'anual' 
                                ? 'Anual' 
                                : event.metadata?.planType === 'trial' 
                                ? 'Teste Gratuito' 
                                : event.metadata?.planType || 'Não especificado'}
                            </span>
                          )}
                          
                          {event.type === 'subscription_activated' && (
                            <span>
                              Início: {event.metadata?.startDate ? formatDate(event.metadata.startDate) : 'Data não disponível'}
                              <br />
                              Término: {event.metadata?.endDate ? formatDate(event.metadata.endDate) : 'Data não disponível'}
                            </span>
                          )}
                          
                          {event.type === 'payment_received' && (
                            <span>
                              Valor: R$ 99.90
                              <br />
                              Método: Cartão de crédito
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Informações adicionais */}
      <div className="mt-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Informações sobre seu histórico</AlertTitle>
          <AlertDescription>
            Esse histórico mostra todos os eventos relacionados à sua assinatura no QUERO FRETES,
            incluindo criação, ativação, pagamentos e cancelamentos.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}