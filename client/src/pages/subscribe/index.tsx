import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubscriptionDetails from '@/components/ui/subscription-details';

export default function SubscribePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState('details');
  const [location, navigate] = useLocation();
  
  // Buscar informações da assinatura
  const { 
    data: subscriptionData, 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['/api/user/subscription-info'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/subscription-info');
      return await res.json();
    }
  });
  
  // Verificar parâmetros de URL para exibir mensagens de status
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('status');
  const type = urlParams.get('type');
  
  // Renderizar mensagens de status com base na URL
  const renderStatusMessage = () => {
    if (status === 'success') {
      return (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Pagamento realizado com sucesso!</AlertTitle>
          <AlertDescription>
            {type === 'monthly' 
              ? 'Sua assinatura mensal foi ativada com sucesso.' 
              : type === 'annual' 
              ? 'Sua assinatura anual foi ativada com sucesso.' 
              : 'Sua assinatura foi ativada com sucesso.'}
          </AlertDescription>
        </Alert>
      );
    } else if (status === 'cancelled') {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Pagamento cancelado</AlertTitle>
          <AlertDescription>
            O processo de pagamento foi cancelado. Você pode tentar novamente quando desejar.
          </AlertDescription>
        </Alert>
      );
    } else if (status === 'pending') {
      return (
        <Alert variant="default" className="mb-6 bg-amber-50 text-amber-800 border-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Pagamento pendente</AlertTitle>
          <AlertDescription>
            Seu pagamento está pendente de confirmação. Assim que for processado, sua assinatura será ativada automaticamente.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };
  
  // Limpar parâmetros de URL após exibir mensagem
  React.useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        navigate('/subscribe', { replace: true });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);
  
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
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Gerenciar Assinatura</h1>
        <p className="text-muted-foreground">Gerencie sua assinatura e métodos de pagamento para o QUERO FRETES</p>
      </div>
      
      {/* Exibir mensagens de status */}
      {renderStatusMessage()}
      
      {/* Abas de navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="details" className="flex-1 sm:flex-initial">
            Detalhes da Assinatura
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex-1 sm:flex-initial">
            Planos Disponíveis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          {/* Detalhes da assinatura */}
          <SubscriptionDetails 
            subscriptionData={subscriptionData || {}} 
            isLoading={isLoading} 
          />
          
          {/* Informações adicionais */}
          <Card>
            <CardHeader>
              <CardTitle>Sobre o Sistema QUERO FRETES</CardTitle>
              <CardDescription>Conheça as vantagens da nossa plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Benefícios da assinatura</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>Acesso a todas as funcionalidades do sistema</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>Gerenciamento completo de motoristas e veículos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>Controle de fretes e monitoramento em tempo real</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>Suporte prioritário via e-mail e WhatsApp</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Formas de pagamento</h3>
                  <p className="mb-4 text-muted-foreground">
                    Aceitamos diversas formas de pagamento através do Mercado Pago, incluindo:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-bold text-xs">CC</span>
                      </div>
                      <span>Cartão de crédito</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-bold text-xs">DC</span>
                      </div>
                      <span>Cartão de débito</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-amber-700 font-bold text-xs">Pix</span>
                      </div>
                      <span>Pagamento via Pix</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-700 font-bold text-xs">TB</span>
                      </div>
                      <span>Transferência bancária</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plans" className="space-y-6">
          {/* Planos disponíveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plano Mensal */}
            <Card>
              <CardHeader>
                <CardTitle>Plano Mensal</CardTitle>
                <CardDescription>Acesso completo por 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-3xl font-bold">
                    R$ 99,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">Pagamento mensal</p>
                </div>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Acesso a todas as funcionalidades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Gerenciamento de fretes ilimitado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Cancele quando quiser</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  asChild
                >
                  <a href="/subscribe/plans?plan=monthly">
                    Assinar Plano Mensal
                  </a>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Plano Anual */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Plano Anual</CardTitle>
                    <CardDescription>Economia de 20% no valor mensal</CardDescription>
                  </div>
                  <div className="bg-primary text-primary-foreground text-xs font-bold py-1 px-3 rounded-full">
                    Mais Vantajoso
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-3xl font-bold">
                    R$ 960,00<span className="text-sm font-normal text-muted-foreground">/ano</span>
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">Equivalente a R$ 80,00/mês</p>
                </div>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Acesso a todas as funcionalidades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Gerenciamento de fretes ilimitado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Economia de R$ 238,80 por ano</strong></span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  asChild
                >
                  <a href="/subscribe/plans?plan=annual">
                    Assinar Plano Anual
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Período de teste */}
          <Card>
            <CardHeader>
              <CardTitle>Teste Gratuito</CardTitle>
              <CardDescription>Experimente o sistema por 7 dias sem compromisso</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Inicie um período de teste gratuito de 7 dias para explorar todas as funcionalidades do sistema QUERO FRETES.
                Não é necessário cartão de crédito para começar.
              </p>
              <Alert variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  Após o período de teste, você precisará escolher um plano para continuar utilizando o sistema.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setActiveTab('details')}
              >
                Ver Detalhes da Assinatura
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}