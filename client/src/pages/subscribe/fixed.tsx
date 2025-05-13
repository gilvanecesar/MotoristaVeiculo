import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MercadoPagoButton } from '@/components/MercadoPagoButton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Check, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function SubscribeFixed() {
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const { toast } = useToast();

  const handleActivateTrial = async () => {
    try {
      setIsActivatingTrial(true);
      const response = await apiRequest('POST', '/api/activate-trial');
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Período de teste ativado',
          description: `Seu período de teste foi ativado até ${new Date(data.expiresAt).toLocaleDateString()}`,
        });
        
        // Redirecionar para a página inicial após ativar o trial
        setTimeout(() => {
          window.location.href = '/home';
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Não foi possível ativar o período de teste');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao ativar período de teste',
        variant: 'destructive',
      });
    } finally {
      setIsActivatingTrial(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setIsCancellingSubscription(true);
      const response = await apiRequest('POST', '/api/cancel-subscription');
      
      if (response.ok) {
        toast({
          title: 'Assinatura cancelada',
          description: 'Sua assinatura foi cancelada com sucesso. Você ainda terá acesso até o final do período já pago.',
        });
        
        // Redirecionar para a página inicial após cancelar
        setTimeout(() => {
          window.location.href = '/home';
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Não foi possível cancelar a assinatura');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao cancelar assinatura',
        variant: 'destructive',
      });
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  return (
    <div className="container max-w-6xl py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Assine o QueroFretes</h1>
        <p className="text-muted-foreground mt-2">
          Escolha o plano ideal para seu negócio
        </p>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="annual">Anual</TabsTrigger>
            <TabsTrigger value="manage">Gerenciar</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Teste Gratuito</CardTitle>
                <CardDescription>7 dias de acesso total</CardDescription>
                <div className="mt-4 text-4xl font-bold">R$ 0,00</div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Acesso total por 7 dias</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Gerenciamento de fretes</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Gestão de motoristas e veículos</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Relatórios básicos</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleActivateTrial} 
                  disabled={isActivatingTrial} 
                  className="w-full"
                >
                  {isActivatingTrial ? 'Ativando...' : 'Iniciar período de teste'}
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-2 border-primary shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assinatura Mensal</CardTitle>
                    <CardDescription>Pague mensalmente</CardDescription>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-4 text-4xl font-bold">R$ 99,90<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Acesso total ao sistema</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Fretes ilimitados</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Relatórios avançados</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Exportação de dados</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <MercadoPagoButton planType="monthly" className="w-full" />
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="annual" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Teste Gratuito</CardTitle>
                <CardDescription>7 dias de acesso total</CardDescription>
                <div className="mt-4 text-4xl font-bold">R$ 0,00</div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Acesso total por 7 dias</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Gerenciamento de fretes</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Gestão de motoristas e veículos</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Relatórios básicos</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleActivateTrial} 
                  disabled={isActivatingTrial} 
                  className="w-full"
                >
                  {isActivatingTrial ? 'Ativando...' : 'Iniciar período de teste'}
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-2 border-primary shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assinatura Anual</CardTitle>
                    <CardDescription>Economia de 20% em relação ao plano mensal</CardDescription>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-4 text-4xl font-bold">R$ 960,00<span className="text-sm font-normal text-muted-foreground">/ano</span></div>
                <div className="text-muted-foreground text-sm">Equivalente a R$ 80,00/mês</div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Acesso total ao sistema</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Fretes ilimitados</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Relatórios avançados</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Exportação de dados</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>Suporte prioritário 24/7</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <MercadoPagoButton planType="annual" className="w-full" />
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="manage" className="w-full">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Assinatura</CardTitle>
                <CardDescription>Gerencie sua assinatura atual do QueroFretes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">Status da Assinatura</h3>
                    <p className="text-sm text-muted-foreground">Ativa até 12/06/2025</p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Ativa</span>
                </div>
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">Plano Atual</h3>
                    <p className="text-sm text-muted-foreground">Plano Mensal - R$ 99,90/mês</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">Próxima Cobrança</h3>
                    <p className="text-sm text-muted-foreground">12/06/2025</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Método de Pagamento</h3>
                    <p className="text-sm text-muted-foreground">MercadoPago</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  onClick={handleCancelSubscription} 
                  variant="destructive" 
                  className="w-full"
                  disabled={isCancellingSubscription}
                >
                  {isCancellingSubscription ? 'Cancelando...' : 'Cancelar Assinatura'}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Ao cancelar, você terá acesso até o final do período já pago
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground mb-2">
          Dúvidas sobre nossos planos? Entre em contato com nosso suporte
        </p>
        <Link href="/home">
          <Button variant="link">Voltar para a página inicial</Button>
        </Link>
      </div>
    </div>
  );
}