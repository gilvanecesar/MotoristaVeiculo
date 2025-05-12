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
                
                <div className="mt-auto space-y-2">
                <Button 
                  onClick={() => createCheckoutSessionMutation.mutate("monthly")} 
                  disabled={createCheckoutSessionMutation.isPending}
                  className="w-full"
                >
                  {createCheckoutSessionMutation.isPending ? "Carregando..." : "Escolher Plano Mensal"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = "/subscribe/paypal"}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.2881 7.00415C19.4611 7.88815 19.2341 8.52715 18.9031 9.20315C18.1121 10.8111 16.4581 11.8381 14.5721 11.8381H13.2921C13.1041 11.8381 12.9341 11.9761 12.8971 12.1621L12.3641 15.1991C12.3451 15.2901 12.2891 15.3711 12.2081 15.4251C12.1271 15.4801 12.0321 15.5081 11.9351 15.5081H9.62012C9.38112 15.5081 9.20312 15.2991 9.24512 15.0661L10.5951 7.41415C10.6211 7.28815 10.7351 7.19915 10.8641 7.19915H18.5871C18.8431 7.19915 19.0651 7.32915 19.1941 7.54215C19.2391 7.63915 19.2731 7.81315 19.2881 7.00415Z" fill="#1434CB"/>
                    <path d="M8.32505 15.0391L8.32605 15.0341L9.01105 10.9121C9.03605 10.7551 9.16605 10.6401 9.32505 10.6401H11.5081C11.7031 10.6401 11.8311 10.7721 11.8081 10.9651L11.6841 11.7631C11.6611 11.9291 11.5271 12.0401 11.3691 12.0401H10.1341C9.89405 12.0401 9.71605 12.2491 9.75705 12.4831L9.94205 13.7851C9.97505 13.9721 10.1331 14.1101 10.3221 14.1101H10.9131C11.1531 14.1101 11.3311 14.3191 11.2891 14.5531L11.1861 15.1911C11.1671 15.2811 11.1111 15.3611 11.0301 15.4161C10.9491 15.4711 10.8531 15.4991 10.7561 15.4991H8.44105C8.20205 15.5001 8.02505 15.2901 8.06705 15.0571C8.06505 15.0511 8.32505 15.0391 8.32505 15.0391Z" fill="#0070E0"/>
                    <path d="M7.03896 7.15698C7.07996 6.92298 7.32396 6.75098 7.56296 6.75098H11.562C11.791 6.75098 11.968 6.92998 11.944 7.15798L11.873 7.69998C11.836 7.99998 11.566 8.19998 11.281 8.19998H7.49096C7.46596 8.19998 7.44196 8.19698 7.41896 8.19098C7.24296 8.14798 7.11296 7.99298 7.14296 7.80398L7.03896 7.15698Z" fill="#003087"/>
                  </svg>
                  Pagar com PayPal
                </Button>
              </div>
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
                
                <div className="mt-auto space-y-2">
                  <Button 
                    onClick={() => createCheckoutSessionMutation.mutate("annual")} 
                    disabled={createCheckoutSessionMutation.isPending}
                    className="w-full"
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