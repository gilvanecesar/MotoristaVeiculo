import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { useLocation } from 'wouter';

export default function Subscribe() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("annual");

  useEffect(() => {
    // Create subscription link to Mercado Pago as soon as the page loads
    setIsLoading(true);
    apiRequest("POST", "/api/get-or-create-subscription", { planType: selectedPlan })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Falha ao conectar com o servidor de assinatura");
        }
        return res.json();
      })
      .then((data) => {
        if (data.url) {
          setRedirectUrl(data.url);
        } else {
          throw new Error("URL de assinatura não encontrada");
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao criar link de assinatura:", err);
        setError(err.message);
        setIsLoading(false);
        toast({
          title: "Erro na assinatura",
          description: err.message,
          variant: "destructive",
        });
      });
  }, [toast, selectedPlan]);

  const handleContinueToSubscription = () => {
    if (redirectUrl) {
      // Redirecionar para o Mercado Pago
      window.location.href = redirectUrl;
    }
  };

  const handlePlanChange = (plan: string) => {
    setSelectedPlan(plan);
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Preparando ambiente de assinatura...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro na Assinatura</CardTitle>
            <CardDescription>Não foi possível iniciar o processo de assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate("/subscribe/plans")} className="w-full">
              Voltar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!redirectUrl) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro na Configuração</CardTitle>
            <CardDescription>Não foi possível obter as informações de assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Não foi possível conectar ao serviço de pagamento. Tente novamente mais tarde.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate("/subscribe/plans")} className="w-full">
              Voltar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Assinar QUERO FRETES</CardTitle>
          <CardDescription>
            {selectedPlan === "monthly" 
              ? "Assinatura mensal - R$ 99,90/mês" 
              : "Assinatura anual - R$ 99,90/mês com cobrança anual de R$ 1.198,80"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={selectedPlan === "monthly" ? "default" : "outline"}
                className="flex-col h-auto py-4"
                onClick={() => handlePlanChange("monthly")}
              >
                <Clock className="h-6 w-6 mb-2" />
                <span className="font-medium">Mensal</span>
                <span className="text-xs mt-1">R$ 99,90/mês</span>
              </Button>
              <Button 
                variant={selectedPlan === "annual" ? "default" : "outline"} 
                className="flex-col h-auto py-4 relative"
                onClick={() => handlePlanChange("annual")}
              >
                <CreditCard className="h-6 w-6 mb-2" />
                <span className="font-medium">Anual</span>
                <span className="text-xs mt-1">R$ 1.198,80/ano</span>
                {selectedPlan === "annual" && (
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                    Melhor oferta
                  </span>
                )}
              </Button>
            </div>
            
            <div className="bg-muted p-4 rounded-lg mt-6">
              <h3 className="font-medium mb-3">Inclui todos os recursos:</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Gerenciamento de motoristas e veículos</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Gerenciamento de fretes e controle de destinos</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Monitoramento de documentação</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Suporte técnico em horário comercial</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col space-y-4">
          <Button 
            onClick={handleContinueToSubscription}
            className="w-full"
            size="lg"
          >
            Continuar para Pagamento
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground text-center w-full">
            Ao finalizar, você concorda com os termos de serviço e política de privacidade.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}