import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function PaymentSuccessPage() {
  const [countdown, setCountdown] = useState(5);
  const [, setLocation] = useLocation();
  
  // Automaticamente redirecionar para o dashboard após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/dashboard");
    }, 5000);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [setLocation]);
  
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="w-full max-w-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10 space-y-6 text-center py-6">
          <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-20 h-20 flex items-center justify-center">
            <CheckCircle className="h-14 w-14" />
          </div>
          <CardTitle className="text-3xl font-bold text-center">
            Pagamento Confirmado!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 pb-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg">
              Obrigado por assinar o Plano Premium do QUERO FRETES!
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Seu acesso a todos os recursos premium foi ativado com sucesso.
            </p>
          </div>
          
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold">Detalhes da assinatura:</h3>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• Plano Premium - R$ 99,90/mês (cobrança anual)</li>
              <li>• Acesso a todos os recursos do sistema</li>
              <li>• Suporte prioritário</li>
              <li>• Data de renovação automática: em 12 meses</li>
            </ul>
          </div>
          
          <div className="text-center text-sm text-slate-500">
            Você será redirecionado para o dashboard em {countdown} segundos...
          </div>
          
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => setLocation("/dashboard")}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Ir para o Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}