import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Calendar, Check, AlertCircle, QrCode, Building2 } from "lucide-react";
import { useLocation } from 'wouter';
import { Badge } from "@/components/ui/badge";

type PaymentMethod = 'pix' | 'mercadopago' | 'paypal';

export default function Checkout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('pix');
  const [pixCharge, setPixCharge] = useState<any>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  
  // Get the plan from URL query parameter
  const [searchParams] = useState<URLSearchParams>(() => new URLSearchParams(window.location.search));
  const [selectedPlan, setSelectedPlan] = useState<string>(() => {
    const planFromURL = searchParams.get("plan");
    return planFromURL === "monthly" ? "monthly" : "annual";
  });

  const planDetails = {
    monthly: {
      name: "Plano Mensal",
      price: "R$ 49,90",
      description: "Acesso por 30 dias",
      period: "mês"
    },
    annual: {
      name: "Plano Anual", 
      price: "R$ 499,00",
      description: "Acesso por 12 meses",
      period: "ano",
      savings: "Economia de R$ 99,80"
    }
  };

  const createPixPayment = async () => {
    setIsCreatingPayment(true);
    try {
      const response = await apiRequest("POST", "/api/openpix/create-charge", {
        planType: selectedPlan,
        value: selectedPlan === "monthly" ? 4990 : 49900,
        email: "customer@querofretes.com.br",
        name: "Assinatura QUERO FRETES"
      });
      const data = await response.json();
      
      if (response.ok) {
        setPixCharge(data);
        toast({
          title: "PIX gerado com sucesso",
          description: "Escaneie o QR Code ou copie o código PIX para pagar",
        });
      } else {
        throw new Error(data.details || "Erro ao criar cobrança PIX");
      }
    } catch (error: any) {
      console.error("Erro ao criar PIX:", error);
      toast({
        title: "Erro",
        description: `Falha ao gerar PIX: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleMercadoPagoPayment = async () => {
    setIsCreatingPayment(true);
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", { 
        planType: selectedPlan
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        throw new Error("Erro ao criar pagamento Mercado Pago");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handlePayPalPayment = () => {
    toast({
      title: "PayPal",
      description: "Integração PayPal em desenvolvimento",
    });
  };

  const handleContinueToPayment = () => {
    if (redirectUrl) {
      // Redirecionar para o Mercado Pago
      window.location.href = redirectUrl;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Preparando ambiente de pagamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Erro no Pagamento
            </CardTitle>
            <CardDescription>Não foi possível iniciar o processo de pagamento</CardDescription>
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
            <CardDescription>Não foi possível obter as informações de pagamento</CardDescription>
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
          <CardTitle>Resumo da Assinatura</CardTitle>
          <CardDescription>
            {selectedPlan === "monthly" 
              ? "Assinatura mensal do QUERO FRETES - R$ 99,90/mês" 
              : "Assinatura anual do QUERO FRETES - economia equivalente a R$ 80,00/mês"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Detalhes do Plano
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Plano:</div>
                <div className="font-medium">{selectedPlan === "monthly" ? "Mensal" : "Anual"}</div>
                <div className="text-muted-foreground">Valor:</div>
                <div className="font-medium">
                  {selectedPlan === "monthly" ? "R$ 99,90/mês" : "R$ 960,00/ano"}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-600" />
                O que está incluído:
              </h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Acesso completo à plataforma QUERO FRETES</li>
                <li>Gerenciamento de motoristas e veículos</li>
                <li>Gerenciamento de fretes e destinos</li>
                <li>Monitoramento de documentação</li>
                <li>Relatórios e estatísticas</li>
                <li>Suporte técnico durante horário comercial</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col space-y-4">
          <Button 
            onClick={handleContinueToPayment}
            className="w-full"
            size="lg"
          >
            Continuar para Pagamento
          </Button>
          <p className="text-xs text-muted-foreground text-center w-full">
            Ao finalizar, você concorda com os termos de serviço e política de privacidade.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}