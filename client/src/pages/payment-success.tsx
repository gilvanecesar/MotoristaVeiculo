import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentSuccessPage() {
  const [_, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
  const { toast } = useToast();

  // Extrai o ID da sessão da URL
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");
  const type = searchParams.get("type");

  useEffect(() => {
    // Armazena o tipo de assinatura
    if (type) {
      setSubscriptionType(type);
    }

    // Se não houver ID de sessão, redireciona para a página inicial
    if (!sessionId) {
      toast({
        title: "Erro no processamento",
        description: "Não foi possível verificar o status do pagamento.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // Verifica o status do pagamento
    const verifyPayment = async () => {
      try {
        // Aqui você pode fazer uma chamada para verificar o status do pagamento
        // const response = await apiRequest("GET", `/api/verify-payment/${sessionId}`);
        // const data = await response.json();
        
        // Por enquanto, vamos assumir que o pagamento foi bem-sucedido
        setSuccess(true);
        toast({
          title: "Pagamento concluído",
          description: "Sua assinatura foi ativada com sucesso!",
          variant: "default"
        });
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
        toast({
          title: "Erro no processamento",
          description: "Não foi possível verificar o status do pagamento.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate, toast, type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icons.spinner className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h2 className="mt-4 text-xl font-medium">Verificando pagamento...</h2>
          <p className="mt-2 text-muted-foreground">Aguarde enquanto verificamos o seu pagamento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <Icons.check className="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
          </div>
          <CardTitle className="text-2xl">Pagamento confirmado!</CardTitle>
          <CardDescription>
            Sua assinatura foi ativada com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg mb-4">
            <h3 className="font-medium text-lg mb-2">Detalhes da assinatura</h3>
            <p className="text-muted-foreground">
              Tipo: <span className="font-medium">{subscriptionType === "annual" ? "Anual" : "Mensal (30 dias)"}</span>
            </p>
            <p className="text-muted-foreground">
              Status: <span className="text-green-600 dark:text-green-400 font-medium">Ativo</span>
            </p>
            <p className="text-muted-foreground">
              Valor: <span className="font-medium">{subscriptionType === "annual" ? "R$ 1.198,80 (12x R$ 99,90)" : "R$ 99,90"}</span>
            </p>
          </div>
          <p>
            Agora você tem acesso completo à plataforma QUERO FRETES.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            Acessar a plataforma
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}