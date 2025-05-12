import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Check, 
  X, 
  Calendar, 
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SubscribePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Buscar informações da assinatura
  const { 
    data: subscriptionInfo, 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['/api/user/subscription-info'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/subscription-info');
      const data = await res.json();
      return data;
    }
  });
  
  // Mutation para criar sessão do portal Stripe
  const createPortalSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/create-portal-session');
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      // Redirecionar para o portal do Stripe
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao acessar portal de pagamento",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation para cancelar assinatura
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/cancel-subscription');
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-info'] });
      setCancelDialogOpen(false);
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso. O acesso continua disponível até o final do período atual.",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar assinatura",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation para iniciar uma nova assinatura
  const createCheckoutSessionMutation = useMutation({
    mutationFn: async (planType: string) => {
      try {
        // Primeiro, tente usar o método principal
        const res = await apiRequest('POST', '/api/create-checkout-session', { planType });
        const data = await res.json();
        
        if (data.url) {
          return data;
        } else {
          throw new Error("URL de checkout não disponível");
        }
      } catch (primaryError) {
        console.error("Erro no método principal de checkout:", primaryError);
        
        // Fallback para o método alternativo
        try {
          const res = await apiRequest('POST', '/api/get-or-create-subscription', { planType });
          const data = await res.json();
          
          // Verificar se a resposta tem sucesso, mesmo sem clientSecret
          if (data.success) {
            return {
              isClientSecret: true,
              clientSecret: data.clientSecret || null,
              subscriptionId: data.subscriptionId,
              success: true
            };
          } else {
            throw new Error("Não foi possível criar a assinatura");
          }
        } catch (fallbackError) {
          console.error("Erro ao criar assinatura:", fallbackError);
          throw fallbackError;
        }
      }
    },
    onSuccess: (data) => {
      // Verificar qual método foi usado com base na resposta
      if (data.isClientSecret) {
        // Se for o método alternativo, exibir message com link de próximos passos
        toast({
          title: "Assinatura iniciada",
          description: "Sua assinatura foi criada com sucesso! Você pode gerenciar os detalhes de pagamento na página de assinaturas.",
          variant: "default"
        });
        
        // Atualizar a página para mostrar as informações atualizadas
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-info'] });
          window.location.reload();
        }, 1500);
      } else {
        // Método principal - redirecionar para o checkout do Stripe
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao iniciar pagamento",
        description: "Não foi possível criar a assinatura. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      });
      console.error("Erro detalhado:", error);
    }
  });
  
  // Mutation para ativar período de teste
  const activateTrialMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/activate-trial');
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-info'] });
      toast({
        title: "Período de teste ativado",
        description: "Seu período de teste de 7 dias foi ativado com sucesso.",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao ativar período de teste",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Não disponível";
    try {
      const date = new Date(dateStr);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: pt });
    } catch (err) {
      return "Data inválida";
    }
  };
  
  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar informações</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados da sua assinatura. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Gerenciar Assinatura</h1>
        <p className="text-muted-foreground">Gerencie sua assinatura e métodos de pagamento para o QUERO FRETES</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Status da Assinatura Atual */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Status da Assinatura</CardTitle>
            <CardDescription>Veja os detalhes da sua assinatura atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-start gap-3">
                {subscriptionInfo?.active ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : subscriptionInfo?.isTrial ? (
                  <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                ) : (
                  <X className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">Status</p>
                  <div className="flex items-center gap-2">
                    {subscriptionInfo?.active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Ativa</Badge>
                    ) : subscriptionInfo?.isTrial ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Período de Teste</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">Inativa</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Tipo de Plano */}
              {(subscriptionInfo?.active || subscriptionInfo?.isTrial) && (
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Plano</p>
                    <p className="text-sm text-slate-600">
                      {subscriptionInfo?.isTrial
                        ? "Período de Teste (7 dias)"
                        : subscriptionInfo?.planType === "monthly"
                          ? "Mensal - R$ 99,90/mês"
                          : "Anual - R$ 960,00/ano"}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Data de Expiração */}
              {(subscriptionInfo?.active || subscriptionInfo?.isTrial) && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{subscriptionInfo?.isTrial ? "Término do Teste" : "Próxima Cobrança"}</p>
                    <p className="text-sm text-slate-600">
                      {formatDate(subscriptionInfo?.expiresAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            {/* Ações para Assinatura Ativa */}
            {subscriptionInfo?.active && !subscriptionInfo?.isTrial && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => createPortalSessionMutation.mutate()}
                  disabled={createPortalSessionMutation.isPending}
                >
                  {createPortalSessionMutation.isPending ? "Carregando..." : "Gerenciar Pagamentos"}
                </Button>
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={cancelSubscriptionMutation.isPending}
                >
                  {cancelSubscriptionMutation.isPending ? "Processando..." : "Cancelar Assinatura"}
                </Button>
              </>
            )}
            
            {/* Ações para Teste */}
            {subscriptionInfo?.isTrial && (
              <Button 
                onClick={() => createCheckoutSessionMutation.mutate(
                  // Oferece a assinatura mensal por padrão após o período de teste
                  "monthly"
                )}
                disabled={createCheckoutSessionMutation.isPending}
              >
                {createCheckoutSessionMutation.isPending ? "Carregando..." : "Assinar Agora"}
              </Button>
            )}
            
            {/* Ações para Assinatura Inativa */}
            {!subscriptionInfo?.active && !subscriptionInfo?.isTrial && (
              <div className="flex flex-col gap-3 w-full">
                <Button 
                  onClick={() => createCheckoutSessionMutation.mutate("monthly")}
                  disabled={createCheckoutSessionMutation.isPending}
                  className="w-full"
                >
                  {createCheckoutSessionMutation.isPending ? "Carregando..." : "Assinar Agora"}
                </Button>
                
                {!subscriptionInfo?.trialUsed && (
                  <Button 
                    variant="outline" 
                    onClick={() => activateTrialMutation.mutate()}
                    disabled={activateTrialMutation.isPending}
                    className="w-full"
                  >
                    {activateTrialMutation.isPending ? "Ativando..." : "Iniciar Teste Gratuito"}
                  </Button>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
        
        {/* Planos de Assinatura */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Planos Disponíveis</CardTitle>
            <CardDescription>Escolha o plano ideal para o seu negócio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Plano Mensal */}
              <div className="flex flex-col p-4 border rounded-lg hover:border-primary/50 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Plano Mensal</h3>
                    <p className="text-muted-foreground text-sm">Faturamento mensal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">R$ 99,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Acesso completo ao sistema</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Gerenciamento de fretes ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Cadastro de motoristas e veículos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Suporte prioritário</span>
                  </li>
                </ul>
                
                <Button 
                  onClick={() => createCheckoutSessionMutation.mutate("monthly")} 
                  disabled={createCheckoutSessionMutation.isPending}
                  className="mt-auto"
                >
                  {createCheckoutSessionMutation.isPending ? "Carregando..." : "Escolher Plano Mensal"}
                </Button>
              </div>
              
              {/* Plano Anual */}
              <div className="flex flex-col p-4 border rounded-lg border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-md">Melhor Custo-Benefício</Badge>
                </div>
                
                <div className="flex justify-between items-start mb-3 mt-2">
                  <div>
                    <h3 className="font-semibold text-lg">Plano Anual</h3>
                    <p className="text-muted-foreground text-sm">Faturamento anual</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">R$ 960,00<span className="text-sm font-normal text-muted-foreground">/ano</span></p>
                    <p className="text-sm text-green-600 font-medium">Economize R$ 238,80</p>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Acesso completo ao sistema</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Gerenciamento de fretes ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Cadastro de motoristas e veículos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Suporte prioritário</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">2 meses grátis</span>
                  </li>
                </ul>
                
                <Button 
                  onClick={() => createCheckoutSessionMutation.mutate("annual")} 
                  disabled={createCheckoutSessionMutation.isPending}
                  className="mt-auto"
                  variant="default"
                >
                  {createCheckoutSessionMutation.isPending ? "Carregando..." : "Escolher Plano Anual"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Formas de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aceitamos cartões de crédito das principais bandeiras. Os pagamentos são processados com segurança pelo Stripe.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Período de Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Experimente gratuitamente por 7 dias. Após este período, a cobrança será feita automaticamente se você não cancelar.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Política de Reembolso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Se não estiver satisfeito, solicite reembolso em até 7 dias após a assinatura entrando em contato com nossa equipe.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Diálogo de Confirmação para Cancelamento */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Você perderá acesso às funcionalidades premium após o término do período atual.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm flex items-start gap-2 my-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p>
              Seu acesso continuará disponível até {formatDate(subscriptionInfo?.expiresAt)}. Após esta data, 
              você precisará renovar a assinatura para continuar utilizando todos os recursos.
            </p>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelSubscriptionMutation.mutate()}
              disabled={cancelSubscriptionMutation.isPending}
            >
              {cancelSubscriptionMutation.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}