import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { 
  ArrowLeft, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Shield,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';

export default function SubscriptionPlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Obter o plano da URL
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get('plan');
  
  // Definir o tipo de plano ativo
  const [activePlan, setActivePlan] = React.useState(
    planParam === 'monthly' || planParam === 'annual' ? planParam : 'monthly'
  );
  
  // Mutation para criar preferência de pagamento
  const createPaymentMutation = useMutation({
    mutationFn: async (planType: string) => {
      const res = await apiRequest('POST', '/api/create-payment-preference', { planType });
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        // Redirecionar para o Mercado Pago
        window.location.href = data.redirectUrl;
      } else {
        toast({
          title: "Erro no processamento",
          description: "Não foi possível gerar o link de pagamento. Tente novamente mais tarde.",
          variant: "destructive"
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao iniciar pagamento",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.",
        variant: "destructive"
      });
      console.error("Erro ao criar pagamento:", error);
    }
  });
  
  // Iniciar o processo de pagamento
  const startPaymentProcess = (planType: string) => {
    // Modificar URL para refletir o plano escolhido
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('plan', planType);
    window.history.replaceState({}, '', newUrl.toString());
    
    // Chamar a API para criar a preferência de pagamento
    createPaymentMutation.mutate(planType);
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Escolha seu Plano</h1>
            <p className="text-muted-foreground">Selecione o plano que melhor atende às suas necessidades</p>
          </div>
          
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
      
      {/* Alerta de segurança */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Lock className="h-4 w-4 text-blue-500" />
        <AlertTitle>Pagamento seguro</AlertTitle>
        <AlertDescription>
          Todos os pagamentos são processados com segurança através do Mercado Pago.
          Seus dados de pagamento nunca são armazenados em nossos servidores.
        </AlertDescription>
      </Alert>
      
      {/* Seleção de período */}
      <div className="mb-8">
        <label className="text-sm font-medium mb-2 block">Selecione o período de assinatura:</label>
        <Tabs
          value={activePlan}
          onValueChange={setActivePlan}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="annual">Anual (20% de desconto)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Plano Mensal</CardTitle>
                <CardDescription>
                  Acesso completo por 30 dias com renovação automática
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-3xl font-bold">
                    R$ 99,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Acesso completo ao sistema</h4>
                      <p className="text-sm text-muted-foreground">
                        Todas as funcionalidades desbloqueadas
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Cobrança mensal</h4>
                      <p className="text-sm text-muted-foreground">
                        Renovação automática a cada 30 dias
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Cancele quando quiser</h4>
                      <p className="text-sm text-muted-foreground">
                        Sem taxas ou multas por cancelamento
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => startPaymentProcess('monthly')}
                  disabled={createPaymentMutation.isPending}
                >
                  {createPaymentMutation.isPending && activePlan === 'monthly' 
                    ? 'Processando...' 
                    : 'Assinar Plano Mensal'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="annual" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Plano Anual</CardTitle>
                    <CardDescription>
                      Acesso completo por 12 meses com economia de 20%
                    </CardDescription>
                  </div>
                  <div className="bg-primary text-primary-foreground text-xs font-bold py-1 px-3 rounded-full">
                    Melhor Valor
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <p className="text-3xl font-bold">
                    R$ 960,00<span className="text-sm font-normal text-muted-foreground">/ano</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="line-through mr-1">R$ 1.198,80</span> 
                    <span className="text-green-600 font-medium">Economia de R$ 238,80</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Equivalente a R$ 80,00 por mês
                  </p>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Acesso completo ao sistema</h4>
                      <p className="text-sm text-muted-foreground">
                        Todas as funcionalidades desbloqueadas
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Cobrança anual</h4>
                      <p className="text-sm text-muted-foreground">
                        Renovação automática a cada 12 meses
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Preço bloqueado</h4>
                      <p className="text-sm text-muted-foreground">
                        Garantia de manutenção do valor por 12 meses
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => startPaymentProcess('annual')}
                  disabled={createPaymentMutation.isPending}
                >
                  {createPaymentMutation.isPending && activePlan === 'annual' 
                    ? 'Processando...' 
                    : 'Assinar Plano Anual'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Informações adicionais */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Perguntas frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Como funciona o período de teste?</h3>
              <p className="text-muted-foreground">
                O período de teste gratuito tem duração de 7 dias e oferece acesso a todas as 
                funcionalidades do sistema. Após esse período, caso não tenha contratado um plano,
                o acesso será limitado.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Como posso cancelar minha assinatura?</h3>
              <p className="text-muted-foreground">
                Você pode cancelar sua assinatura a qualquer momento através da 
                página de Gerenciamento da Assinatura. Após o cancelamento, você continuará
                tendo acesso ao sistema até o final do período já pago.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Quais formas de pagamento são aceitas?</h3>
              <p className="text-muted-foreground">
                Aceitamos pagamentos via Mercado Pago, que inclui cartão de crédito, cartão de débito,
                Pix e transferência bancária.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Posso mudar de plano?</h3>
              <p className="text-muted-foreground">
                Sim, você pode mudar de plano a qualquer momento. Caso mude de um plano mensal para anual,
                o valor será recalculado considerando o tempo restante de uso.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}