import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';

interface SubscriptionDetailsProps {
  subscriptionData: {
    active: boolean;
    isTrial: boolean;
    trialUsed: boolean;
    daysRemaining: number | null;
    planType: string | null;
    expiresAt: string | null;
    formattedExpirationDate: string | null;
    paymentMethod: string | null;
    lastPaymentDate: string | null;
    nextPaymentDate: string | null;
    paymentRequired: boolean;
    subscription?: any;
  };
  isLoading: boolean;
}

export default function SubscriptionDetails({ 
  subscriptionData, 
  isLoading 
}: SubscriptionDetailsProps) {
  const { toast } = useToast();

  // Verificar se os dados de assinatura estão presentes e válidos
  // Se não houver dados, transformar em um objeto válido mas vazio para evitar erros
  const safeSubscriptionData = subscriptionData || {
    active: false,
    isTrial: false,
    trialUsed: false,
    daysRemaining: null,
    planType: null,
    expiresAt: null,
    formattedExpirationDate: null,
    paymentMethod: null,
    paymentRequired: true
  };
  
  // Mutation para cancelar assinatura
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest('POST', '/api/cancel-subscription');
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Erro ao cancelar assinatura: ${errorText}`);
        }
        return await res.json();
      } catch (err) {
        console.error("Erro ao cancelar assinatura:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-info'] });
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso. Você terá acesso até o final do período atual.",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar assinatura",
        description: error.message || "Ocorreu um erro ao cancelar sua assinatura. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  });
  
  // Trial de 7 dias removido - apenas assinaturas pagas via OpenPix

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // Constantes para renderização - usando os dados seguros para evitar erros
  const isActive = safeSubscriptionData.active;
  const isTrial = safeSubscriptionData.isTrial;
  const daysRemaining = safeSubscriptionData.daysRemaining;
  const isExpired = !isActive && safeSubscriptionData.expiresAt && new Date(safeSubscriptionData.expiresAt) < new Date();
  const needsPayment = safeSubscriptionData.paymentRequired;
  const planType = safeSubscriptionData.planType;
  
  // Determinar o título e ícone da assinatura com base no status
  let statusTitle = "";
  let statusDescription = "";
  let statusIcon = null;
  let statusColor = "";
  
  if (isTrial && isActive) {
    statusTitle = "Período de Teste Grátis";
    const daysText = daysRemaining === 1 ? 'dia' : 'dias';
    statusDescription = `Você tem ${daysRemaining} ${daysText} restantes no seu período de teste grátis de 7 dias!`;
    statusIcon = <Clock className="h-8 w-8 text-blue-500" />;
    statusColor = "bg-blue-50 text-blue-700 hover:bg-blue-50";
  } else if (isActive) {
    statusTitle = "Assinatura Ativa";
    statusDescription = `Sua assinatura ${planType === 'monthly' ? 'mensal' : 'anual'} está ativa até ${safeSubscriptionData.formattedExpirationDate || 'data não disponível'}`;
    statusIcon = <CheckCircle className="h-8 w-8 text-green-500" />;
    statusColor = "bg-green-50 text-green-700 hover:bg-green-50";
  } else if (isExpired) {
    statusTitle = "Assinatura Expirada";
    statusDescription = safeSubscriptionData.trialUsed 
      ? "Seu período de teste expirou. Assine agora para continuar usando o sistema."
      : "Sua assinatura expirou. Renove para continuar utilizando o sistema.";
    statusIcon = <XCircle className="h-8 w-8 text-red-500" />;
    statusColor = "bg-red-50 text-red-700 hover:bg-red-50";
  } else {
    statusTitle = "Sem Assinatura";
    statusDescription = "Você ainda não possui uma assinatura ativa. Escolha um plano para começar.";
    statusIcon = <CreditCard className="h-8 w-8 text-slate-500" />;
    statusColor = "bg-slate-50 text-slate-700 hover:bg-slate-50";
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Status da Assinatura</CardTitle>
            <CardDescription>
              Informações sobre sua assinatura atual
            </CardDescription>
          </div>
          <Badge variant="outline" className={statusColor}>
            {isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <div className="mb-6 flex items-center gap-4">
              {statusIcon}
              <div>
                <h3 className="text-lg font-medium">{statusTitle}</h3>
                <p className="text-sm text-muted-foreground">{statusDescription}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {planType && (
                <div className="grid grid-cols-2">
                  <div className="text-sm font-medium">Plano:</div>
                  <div className="text-sm">
                    {planType === 'trial' ? 'Período de Teste (Grátis)' :
                     planType === 'monthly' ? 'Mensal (R$ 99,90)' : 
                     planType === 'annual' ? 'Anual (R$ 960,00)' : 
                     planType}
                  </div>
                </div>
              )}
              
              {safeSubscriptionData.expiresAt && (
                <div className="grid grid-cols-2">
                  <div className="text-sm font-medium">Expira em:</div>
                  <div className="text-sm">{safeSubscriptionData.formattedExpirationDate}</div>
                </div>
              )}
              
              {safeSubscriptionData.paymentMethod && (
                <div className="grid grid-cols-2">
                  <div className="text-sm font-medium">Forma de pagamento:</div>
                  <div className="text-sm">
                    {safeSubscriptionData.paymentMethod === 'mercadopago' 
                      ? 'Mercado Pago' 
                      : false  // Stripe removido - apenas OpenPix agora 
                      ? 'Cartão de crédito' 
                      : safeSubscriptionData.paymentMethod}
                  </div>
                </div>
              )}
              
              {subscriptionData.lastPaymentDate && (
                <div className="grid grid-cols-2">
                  <div className="text-sm font-medium">Último pagamento:</div>
                  <div className="text-sm">
                    {new Date(subscriptionData.lastPaymentDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
              
              {subscriptionData.nextPaymentDate && (
                <div className="grid grid-cols-2">
                  <div className="text-sm font-medium">Próximo pagamento:</div>
                  <div className="text-sm">
                    {new Date(subscriptionData.nextPaymentDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-3">
              {needsPayment && (
                <Button asChild className="w-full">
                  <Link href="/subscribe/plans">
                    Assinar Agora
                  </Link>
                </Button>
              )}
              
              {isActive && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Cancelar Assinatura
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Você perderá acesso ao sistema após o período atual. Essa ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => cancelSubscriptionMutation.mutate()}
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        Confirmar Cancelamento
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              <Button 
                variant="outline" 
                className="w-full" 
                asChild
              >
                <Link href="/user/payment-history">
                  Ver Histórico de Pagamentos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}