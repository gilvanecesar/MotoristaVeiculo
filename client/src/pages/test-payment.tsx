import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Loader2, TestTube, Home } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function TestPayment() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [chargeId, setChargeId] = useState<string | null>(null);

  const createTestCharge = async () => {
    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/openpix/create-charge", {
        planType: "monthly"
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setChargeId(data.charge?.identifier);
        toast({
          title: "Cobrança criada!",
          description: "Agora você pode simular o pagamento",
        });
      } else {
        throw new Error(data.details || "Erro ao criar cobrança");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar cobrança",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const simulatePayment = async () => {
    if (!chargeId) return;
    
    setIsSimulating(true);
    try {
      const response = await apiRequest("POST", "/api/openpix/simulate-payment", {
        chargeId: chargeId,
        paymentValue: 4990
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Pagamento simulado!",
          description: "Redirecionando para home em 2 segundos...",
        });
        
        // Redirecionar para home
        setTimeout(() => {
          console.log('Redirecionando para /home...');
          navigate("/home");
        }, 2000);
      } else {
        throw new Error(data.details || "Erro ao simular pagamento");
      }
    } catch (error: any) {
      toast({
        title: "Erro na simulação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TestTube className="h-8 w-8" />
          Teste de Pagamento
        </h1>
        <p className="text-muted-foreground mt-2">
          Página para testar o fluxo completo de pagamento e redirecionamento
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teste de Fluxo de Pagamento</CardTitle>
          <CardDescription>
            Simule o processo completo: criar cobrança → simular pagamento → redirecionamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <Button 
              onClick={createTestCharge}
              disabled={isCreating || chargeId !== null}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando cobrança...
                </>
              ) : (
                "1. Criar Cobrança PIX"
              )}
            </Button>

            {chargeId && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-800">
                  ✅ Cobrança criada com sucesso!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ID: {chargeId}
                </p>
              </div>
            )}

            <Button 
              onClick={simulatePayment}
              disabled={!chargeId || isSimulating}
              variant="outline"
              className="w-full"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Simulando pagamento...
                </>
              ) : (
                "2. Simular Pagamento"
              )}
            </Button>

            <Button 
              onClick={() => navigate("/home")}
              variant="ghost"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir para Home (manual)
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Como testar:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Clique em "Criar Cobrança PIX"</li>
              <li>2. Clique em "Simular Pagamento"</li>
              <li>3. Aguarde o redirecionamento automático para /home</li>
              <li>4. Verifique se sua assinatura foi ativada</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}