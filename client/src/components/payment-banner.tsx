import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

/**
 * Banner de pagamento para ser exibido abaixo do menu
 * com opção de assinatura anual por R$ 99,90/mês
 */
export function PaymentBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Não mostrar o banner para administradores, motoristas ou usuários com assinatura ativa
  if (!user || user.profileType === 'admin' || user.profileType === 'motorista' || user.subscriptionActive) {
    return null;
  }

  // Função para iniciar o checkout
  const initiateCheckout = async () => {
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para continuar com a assinatura.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/create-checkout-session");
      const data = await response.json();
      
      // Redireciona para a página de checkout do Stripe
      window.location.href = data.url;
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: "Ocorreu um erro ao iniciar o processo de pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="flex-1 md:mr-6 text-center md:text-left mb-4 md:mb-0">
          <h3 className="font-bold text-lg">Plano Premium QUERO FRETES</h3>
          <p className="text-sm md:text-base">
            Acesso completo a todas as funcionalidades por apenas{" "}
            <span className="font-bold">R$ 49,90/mês</span> com pagamento via PIX
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button 
            onClick={initiateCheckout} 
            disabled={isLoading}
            size="lg"
            className="bg-white text-blue-900 hover:bg-blue-100 font-bold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Assinar Agora"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}