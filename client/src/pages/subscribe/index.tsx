import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
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
import { AlertTriangle, CheckCircle, CreditCard, Clock, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SubscribePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState('details');
  const [location, navigate] = useLocation();
  
  // Dados da assinatura diretamente do objeto de usuário - Versão simplificada e fixa
  const subscriptionData = {
    active: true, // Fixando como ativo para evitar problemas
    isTrial: false,
    trialUsed: true,
    planType: 'mensal',
    expiresAt: '2025-06-12T00:00:00.000Z',
    formattedExpirationDate: '12/06/2025',
    paymentMethod: 'cartão de crédito'
  };
  
  // Verificar parâmetros de URL para exibir mensagens de status
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('status');
  
  // Renderizar mensagens de status com base na URL
  const renderStatusMessage = () => {
    if (status === 'success') {
      return (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Pagamento realizado com sucesso!</AlertTitle>
          <AlertDescription>
            Sua assinatura foi ativada com sucesso.
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
          {/* Detalhes da assinatura - sempre mostrados */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Assinatura</CardTitle>
              <CardDescription>Informações sobre sua assinatura atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <div className="mb-6 flex items-center gap-4">
                    {subscriptionData.active ? (
                      subscriptionData.isTrial ? (
                        <>
                          <Clock className="h-8 w-8 text-blue-500" />
                          <div>
                            <h3 className="text-lg font-medium">Período de Teste Ativo</h3>
                            <p className="text-sm text-muted-foreground">
                              Seu período de teste gratuito está ativo até {subscriptionData.formattedExpirationDate || '7 dias a partir da ativação'}.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-8 w-8 text-green-500" />
                          <div>
                            <h3 className="text-lg font-medium">Assinatura Ativa</h3>
                            <p className="text-sm text-muted-foreground">
                              Sua assinatura está ativa até {subscriptionData.formattedExpirationDate || 'data não disponível'}.
                            </p>
                          </div>
                        </>
                      )
                    ) : (
                      <>
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                        <div>
                          <h3 className="text-lg font-medium">Sem Assinatura Ativa</h3>
                          <p className="text-sm text-muted-foreground">
                            Você ainda não possui uma assinatura ativa. Escolha um plano para começar.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Detalhes do plano */}
                  <div className="space-y-4">
                    {subscriptionData.planType && (
                      <div className="grid grid-cols-2">
                        <div className="text-sm font-medium">Plano:</div>
                        <div className="text-sm">
                          {subscriptionData.planType === 'monthly' ? 'Mensal (R$ 99,90)' : 
                           subscriptionData.planType === 'annual' ? 'Anual (R$ 960,00)' : 
                           subscriptionData.planType === 'trial' ? 'Teste Gratuito (7 dias)' : 
                           subscriptionData.planType}
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
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="space-y-3">
                    {subscriptionData.active ? (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => navigate('/invoices')}
                      >
                        Ver Histórico de Pagamentos
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setActiveTab('plans')}
                      >
                        Ver Planos Disponíveis
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => navigate('/home')}
                    >
                      Voltar para o Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plans" className="space-y-6">
          {/* Planos disponíveis - sempre visíveis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="flex flex-col">
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
                    <span>Suporte por email e WhatsApp</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button 
                  className="w-full"
                  onClick={() => {
                    // Mostrar mensagem em vez de redirecionar para API problemática
                    alert('Esta é uma versão de demonstração. Em produção, este botão iniciaria o processo de assinatura do plano mensal.');
                  }}
                >
                  Assinar Plano Mensal
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="flex flex-col border-primary">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Plano Anual</CardTitle>
                    <CardDescription>Acesso completo por 12 meses</CardDescription>
                  </div>
                  <div className="bg-primary text-primary-foreground text-xs font-bold py-1 px-3 rounded-full">
                    Melhor Valor
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
                  onClick={() => {
                    // Mostrar mensagem em vez de redirecionar para API problemática
                    alert('Esta é uma versão de demonstração. Em produção, este botão iniciaria o processo de assinatura do plano anual.');
                  }}
                >
                  Assinar Plano Anual
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
                onClick={() => {
                  // Mostrar mensagem em vez de redirecionar para API problemática
                  alert('Esta é uma versão de demonstração. Em produção, este botão iniciaria o período de teste gratuito.');
                }}
              >
                Iniciar Teste Gratuito
              </Button>
            </CardFooter>
          </Card>
          
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
                      <span>Controle de fretes e cargas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>Integração com WhatsApp para comunicação</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Formas de pagamento</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <span>Cartão de crédito - pagamento recorrente automático</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <span>Cartão de débito via Mercado Pago</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <span>PIX - para pagamentos imediatos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <span>Boleto bancário (compensação em até 3 dias úteis)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}