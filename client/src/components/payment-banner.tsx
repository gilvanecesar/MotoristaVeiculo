import { useState } from "react";
import { CreditCard, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

/**
 * Banner de pagamento para ser exibido abaixo do menu
 * com opção de assinatura anual por R$ 99,90/mês
 */
export function PaymentBanner() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/create-checkout-session", {});
      
      if (response?.url) {
        // Redireciona para a página de checkout do Stripe
        window.location.href = response.url;
      } else {
        toast({
          title: "Erro ao iniciar pagamento",
          description: "Não foi possível iniciar o processo de pagamento. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 bg-slate-50 dark:bg-slate-900 rounded-lg mb-8">
      <Card className="border-primary/20 overflow-hidden">
        <div className="absolute right-0 top-0 h-16 w-16">
          <div className="absolute transform rotate-45 bg-primary text-white font-semibold py-1 right-[-40px] top-[32px] w-[170px] text-center text-xs">
            Oferta Especial
          </div>
        </div>
        
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardTitle className="text-xl md:text-2xl font-bold flex items-center">
            <CreditCard className="mr-2 h-6 w-6" /> Plano Premium
          </CardTitle>
          <CardDescription className="text-slate-100">
            Acesse todos os recursos do sistema com nossa assinatura premium
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 rounded-full p-1">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span>Acesso ilimitado a todos os recursos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 rounded-full p-1">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span>Suporte prioritário via WhatsApp</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 rounded-full p-1">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span>Exportação avançada de relatórios</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 rounded-full p-1">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span>Atualizações contínuas e novas funcionalidades</span>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <div className="text-slate-500 line-through text-sm">De R$ 149,90/mês</div>
              <div className="flex items-center justify-center md:justify-end">
                <span className="text-3xl font-bold text-primary">R$ 99,90</span>
                <span className="text-slate-600 ml-1">/mês</span>
              </div>
              <div className="text-sm text-slate-500 mb-3">Cobrança anual de R$ 1.198,80</div>
              <Progress value={67} className="h-2 mb-1" />
              <div className="text-xs text-slate-500 mb-4">67% das vagas preenchidas</div>
              <Button 
                onClick={handleCheckout} 
                disabled={isLoading}
                size="lg" 
                className="w-full md:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
              >
                {isLoading ? (
                  "Processando..."
                ) : (
                  <>
                    Assinar Agora <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            <span>Pagamento seguro processado pelo Stripe. Cancele a qualquer momento.</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}