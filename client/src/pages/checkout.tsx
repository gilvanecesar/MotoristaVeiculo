import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Erro no processamento",
        description: "Não foi possível conectar ao Stripe. Tente novamente mais tarde.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/payment-success",
        },
      });

      if (error) {
        toast({
          title: "Falha no Pagamento",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro no Processamento",
        description: "Ocorreu um erro durante o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          "Finalizar Pagamento"
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    setIsLoading(true);
    apiRequest("POST", "/api/create-payment-intent", { amount: 1198.80 }) // R$ 1.198,80 (assinatura anual)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Falha ao conectar com o servidor de pagamento");
        }
        return res.json();
      })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao criar intent de pagamento:", err);
        setError(err.message);
        setIsLoading(false);
        toast({
          title: "Erro no pagamento",
          description: err.message,
          variant: "destructive",
        });
      });
  }, [toast]);

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
            <CardTitle className="text-destructive">Erro no Pagamento</CardTitle>
            <CardDescription>Não foi possível iniciar o processo de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              Voltar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro na Configuração</CardTitle>
            <CardDescription>Não foi possível obter as informações de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Verifique se as chaves do Stripe estão configuradas corretamente.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              Voltar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Finalizar Assinatura</CardTitle>
          <CardDescription>
            Assinatura anual do QUERO FRETES - R$ 99,90/mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm />
          </Elements>
        </CardContent>
        <CardFooter className="flex-col space-y-2">
          <p className="text-xs text-muted-foreground text-center w-full">
            Cobrança anual de R$ 1.198,80 (equivalente a R$ 99,90 por mês)
          </p>
          <p className="text-xs text-muted-foreground text-center w-full">
            Ao finalizar, você concorda com os termos de serviço e política de privacidade.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}