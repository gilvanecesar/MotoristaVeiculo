import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";

export default function PaymentCancelPage() {
  const [countdown, setCountdown] = useState(8);
  const [, setLocation] = useLocation();
  
  // Automaticamente redirecionar para a home após 8 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/");
    }, 8000);
    
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
      <Card className="w-full max-w-lg border-slate-200">
        <CardHeader className="bg-slate-50 border-b space-y-6 text-center py-6 dark:bg-slate-800/50 dark:border-slate-700">
          <div className="mx-auto bg-slate-100 text-slate-500 p-4 rounded-full w-20 h-20 flex items-center justify-center dark:bg-slate-700 dark:text-slate-400">
            <XCircle className="h-14 w-14" />
          </div>
          <CardTitle className="text-3xl font-bold text-center">
            Pagamento Cancelado
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 pb-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg">
              O processo de pagamento foi cancelado.
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Nenhuma cobrança foi realizada em seu cartão.
            </p>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 dark:bg-slate-800/50 dark:border-slate-700">
            <h3 className="font-semibold">Motivos comuns para cancelamento:</h3>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• Cancelamento voluntário durante o checkout</li>
              <li>• Problemas com o cartão de crédito</li>
              <li>• Erro temporário no processamento</li>
            </ul>
            <p className="text-sm pt-2 text-slate-600 dark:text-slate-400">
              Deseja tentar novamente? Clique no botão abaixo.
            </p>
          </div>
          
          <div className="text-center text-sm text-slate-500">
            Você será redirecionado para a página inicial em {countdown} segundos...
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o Início
            </Button>
            
            <Button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80"
            >
              <CreditCard className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}