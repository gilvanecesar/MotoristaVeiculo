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
  
  // Mutation para cancelar assinatura
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/cancel-subscription');
      return await res.json();
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
  
  // Mutation para ativar período de teste
  const activateTrialMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/activate-trial');
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-info'] });
      toast({
        title: "Período de teste ativado",
        description: `Seu acesso gratuito de 7 dias foi ativado até ${data.formattedExpirationDate}.`,
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao ativar período de teste",
        description: error.message || "Ocorreu um erro ao ativar o período de teste. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  });

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

  // Constantes para renderização
  const isActive = subscriptionData.active;
  const isExpired = !isActive && subscriptionData.expiresAt && new Date(subscriptionData.expiresAt) < new Date();
  const isTrial = subscriptionData.isTrial;
  const isTrialUsed = subscriptionData.trialUsed;
  const needsPayment = subscriptionData.paymentRequired;
  const planType = subscriptionData.planType;
  
  // Determinar o título e ícone da assinatura com base no status
  let statusTitle = "";
  let statusDescription = "";
  let statusIcon = null;
  let statusColor = "";
  
  if (isActive) {
    if (isTrial) {
      statusTitle = "Período de Teste Ativo";
      statusDescription = `Você está no período de teste gratuito que expira em ${subscriptionData.formattedExpirationDate || 'data não disponível'}`;
      statusIcon = <Clock className="h-8 w-8 text-blue-500" />;
      statusColor = "bg-blue-50 text-blue-700 hover:bg-blue-50";
    } else {
      statusTitle = "Assinatura Ativa";
      statusDescription = `Sua assinatura ${planType === 'monthly' ? 'mensal' : 'anual'} está ativa até ${subscriptionData.formattedExpirationDate || 'data não disponível'}`;
      statusIcon = <CheckCircle className="h-8 w-8 text-green-500" />;
      statusColor = "bg-green-50 text-green-700 hover:bg-green-50";
    }
  } else if (isExpired) {
    statusTitle = "Assinatura Expirada";
    statusDescription = "Sua assinatura expirou. Renove para continuar utilizando o sistema.";
    statusIcon = <XCircle className="h-8 w-8 text-red-500" />;
    statusColor = "bg-red-50 text-red-700 hover:bg-red-50";
  } else if (isTrialUsed) {
    statusTitle = "Período de Teste Expirado";
    statusDescription = "Seu período de teste gratuito expirou. Assine para continuar utilizando o sistema.";
    statusIcon = <AlertTriangle className="h-8 w-8 text-amber-500" />;
    statusColor = "bg-amber-50 text-amber-700 hover:bg-amber-50";
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
                    {planType === 'monthly' ? 'Mensal (R$ 99,90)' : 
                     planType === 'annual' ? 'Anual (R$ 960,00)' : 
                     planType === 'trial' ? 'Teste Gratuito (7 dias)' : 
                     planType}
                  </div>
                </div>
              )}
              
              {subscriptionData.expiresAt && (
                <div className="grid grid-cols-2">
                  <div className="text-sm font-medium">Expira em:</div>
                  <div className="text-sm">{subscriptionData.formattedExpirationDate}</div>
                </div>
              )}
              
              {subscriptionData.paymentMethod && (
                <div className="grid grid-cols-2">
                  <div className="text-sm font-medium">Forma de pagamento:</div>
                  <div className="text-sm">
                    {subscriptionData.paymentMethod === 'mercadopago' 
                      ? 'Mercado Pago' 
                      : subscriptionData.paymentMethod === 'stripe' 
                      ? 'Cartão de crédito' 
                      : subscriptionData.paymentMethod}
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
              {!isActive && !isTrialUsed && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => activateTrialMutation.mutate()}
                  disabled={activateTrialMutation.isPending}
                >
                  Ativar Período de Teste Gratuito
                </Button>
              )}
              
              {needsPayment && (
                <Button asChild className="w-full">
                  <Link href="/subscribe/plans">
                    {isTrialUsed ? 'Assinar Agora' : 'Renovar Assinatura'}
                  </Link>
                </Button>
              )}
              
              {isActive && !isTrial && (
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