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

  // Aguarda carregamento do usuário antes de redirecionar
  useEffect(() => {
    // Só redireciona se realmente não tem usuário após um tempo
    const timer = setTimeout(() => {
      if (!user) {
        console.log("Usuário não encontrado após timeout, redirecionando para /auth");
        navigate('/auth');
      }
    }, 2000); // 2 segundos de espera

    return () => clearTimeout(timer);
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
    onError: () => {
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
      <div className="max-w-2xl mx-auto">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Finalizar Assinatura</h1>
          <p className="text-muted-foreground">
            Complete seu pagamento para acessar todos os recursos do QUERO FRETES
          </p>
        </div>

        {/* Card do Plano */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold">Plano Mensal</h3>
                <p className="text-muted-foreground">Acesso por 30 dias</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">R$ 49,90</span>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total a pagar:</span>
                <span className="text-2xl font-bold">R$ 49,90</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Pagamento PIX */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">💳</div>
              <div>
                <h3 className="text-xl font-semibold">Pagamento via PIX</h3>
                <p className="text-muted-foreground">Pague instantaneamente com PIX - rápido, seguro e sem taxas</p>
              </div>
            </div>

            {/* Etapas do processo */}
            <div className="flex justify-between items-center mb-6 text-sm">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold mb-2">
                  1
                </div>
                <span className="text-center">Gerar QR Code</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold mb-2">
                  2
                </div>
                <span className="text-center">Escanear no App</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold mb-2">
                  3
                </div>
                <span className="text-center">Pagamento Aprovado</span>
              </div>
            </div>

            {/* Botão principal */}
            <Button 
              className="w-full bg-primary hover:bg-primary/90 py-3 text-lg"
              onClick={handleSubscribe}
              disabled={createChargeMutation.isPending}
            >
              {createChargeMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                <>
                  💳 Gerar PIX - R$ 49,90
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Informações de segurança */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="text-orange-500">🔒</div>
            <span>Pagamento processado de forma segura via OpenPix</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Seus dados estão protegidos com criptografia de ponta a ponta
          </p>
        </div>
      </div>
    </div>
  );
}