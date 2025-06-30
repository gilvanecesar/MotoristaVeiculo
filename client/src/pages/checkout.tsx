import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, CreditCard, Loader2, ArrowLeft } from 'lucide-react';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Se usuário não autenticado, redirecionar para login
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Mutation para criar cobrança PIX
  const createChargeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/openpix/create-charge', {
        planType: 'monthly'
      });
      
      if (!res.ok) {
        throw new Error('Erro ao criar cobrança PIX');
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.charge) {
        // Redirecionar para página de pagamento PIX
        navigate(`/payment?chargeId=${data.charge.identifier}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar cobrança",
        description: "Não foi possível gerar o PIX. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleSubscribe = () => {
    createChargeMutation.mutate();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Assine o QueroFretes</h1>
          <p className="text-muted-foreground">
            Escolha o plano ideal para seu negócio
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Teste Gratuito */}
          <Card className="border-muted">
            <CardHeader>
              <CardTitle>Teste Gratuito</CardTitle>
              <CardDescription>7 dias de acesso total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">R$ 0,00</div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Acesso total por 7 dias</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Gerenciamento de fretes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Gestão de motoristas e veículos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Relatórios básicos</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                Iniciar período de teste
              </Button>
            </CardFooter>
          </Card>

          {/* Assinatura Mensal */}
          <Card className="border-primary bg-primary/5 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Plano Oficial
              </Badge>
            </div>
            <CardHeader className="pt-8">
              <CardTitle>Assinatura Mensal</CardTitle>
              <CardDescription>Pague mensalmente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                R$ 49,90
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mt-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Acesso total ao sistema</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Fretes ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Suporte prioritário</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Relatórios avançados</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Exportação de dados</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                className="w-full"
                onClick={handleSubscribe}
                disabled={createChargeMutation.isPending}
              >
                {createChargeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Assinar Plano Mensal
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Assinatura processada pelo OpenPix
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* Informações adicionais */}
        <div className="mt-8">
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle>Dúvidas sobre nossos planos? Entre em contato com nosso suporte</AlertTitle>
            <AlertDescription>
              Você será redirecionado para uma página segura do OpenPix para finalizar seu pagamento via PIX.
            </AlertDescription>
          </Alert>
        </div>

        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => navigate('/home')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a página inicial
          </Button>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm max-w-2xl mx-auto">
          <p><strong>Nota:</strong> A janela de pagamento do OpenPix é gerenciada pelo próprio OpenPix. 
          Para fechar essa janela, você pode usar o botão de voltar do seu navegador ou clicar fora do modal 
          caso o pagamento ainda não tenha sido iniciado.</p>
        </div>
      </div>
    </div>
  );
}