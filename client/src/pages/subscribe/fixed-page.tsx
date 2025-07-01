import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Formata valores monetários
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function SubscriptionPageFixed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Valores fixos para a demonstração
  const subscriptionStatus = {
    active: true,
    isTrial: false,
    startDate: new Date(2025, 4, 1),
    endDate: new Date(2025, 5, 1),
    daysRemaining: 19,
    subscriptionType: "Mensal"
  };

  // Preços fixos
  const prices = {
    monthly: {
      value: 99.90,
      currency: "BRL",
      label: "Mensal",
      savings: 0
    },
    yearly: {
      value: 960.00,
      currency: "BRL",
      label: "Anual",
      savings: 238.80
    }
  };

  useEffect(() => {
    // Simula o carregamento da página
    setTimeout(() => {
      setIsPageLoaded(true);
    }, 1000);
  }, []);

  const handlePayment = () => {
    setIsLoading(true);
    // Simula o processamento de pagamento
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Pagamento processado",
        description: "Esta é uma versão de demonstração. O processamento real de pagamentos está desabilitado.",
      });
    }, 2000);
  };

  const handleCancelSubscription = () => {
    setIsLoading(true);
    // Simula o cancelamento
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Assinatura cancelada",
        description: "Esta é uma versão de demonstração. O cancelamento real está desabilitado.",
      });
    }, 2000);
  };

  return (
    <div>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie seu plano de assinatura e pagamentos
          </p>
        </div>

        {!isPageLoaded ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Status da Assinatura */}
            <Card>
              <CardHeader>
                <CardTitle>Status da Assinatura</CardTitle>
                <CardDescription>
                  {subscriptionStatus.active 
                    ? "Você possui uma assinatura ativa" 
                    : "Você não possui uma assinatura ativa"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <div className="font-semibold">Tipo de Plano</div>
                    <div className="text-muted-foreground">
                      {subscriptionStatus.isTrial 
                        ? "Teste Gratuito" 
                        : subscriptionStatus.subscriptionType}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="font-semibold">Status</div>
                    <div className="flex items-center gap-2">
                      {subscriptionStatus.active && (
                        <>
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-green-500">Ativo</span>
                        </>
                      )}
                      {!subscriptionStatus.active && (
                        <>
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="text-red-500">Inativo</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="font-semibold">Data de Início</div>
                    <div className="text-muted-foreground">
                      {subscriptionStatus.startDate.toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="font-semibold">Data de Expiração</div>
                    <div className="text-muted-foreground">
                      {subscriptionStatus.endDate.toLocaleDateString('pt-BR')}
                      {subscriptionStatus.daysRemaining > 0 && (
                        <span className="ml-2 text-sm text-blue-500">
                          (em {subscriptionStatus.daysRemaining} dias)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                {subscriptionStatus.active && (
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cancelar Assinatura
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Opções de Assinatura */}
            {!subscriptionStatus.active && (
              <Card>
                <CardHeader>
                  <CardTitle>Escolha um Plano</CardTitle>
                  <CardDescription>
                    Selecione o plano que melhor atende às suas necessidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs 
                    defaultValue="monthly" 
                    value={selectedPlan}
                    onValueChange={(value) => setSelectedPlan(value as "monthly" | "yearly")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                      <TabsTrigger value="monthly">Mensal</TabsTrigger>
                      <TabsTrigger value="yearly">Anual</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="monthly">
                      <div className="grid gap-8 md:grid-cols-1">
                        <PlanCard
                          title="Plano Mensal"
                          description="Acesso a todos os recursos por um mês"
                          price={prices.monthly.value}
                          currency={prices.monthly.currency}
                          interval="mensal"
                          features={[
                            "Acesso ilimitado a todos os recursos",
                            "Integração com WhatsApp",
                            "Relatórios e estatísticas",
                            "Suporte prioritário",
                            "Atualizações gratuitas"
                          ]}
                          onSelect={handlePayment}
                          isLoading={isLoading}
                          isSelected={true}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="yearly">
                      <div className="grid gap-8 md:grid-cols-1">
                        <PlanCard
                          title="Plano Anual"
                          description="Acesso a todos os recursos por um ano"
                          price={prices.yearly.value}
                          currency={prices.yearly.currency}
                          interval="anual"
                          features={[
                            "Tudo no plano mensal",
                            "2 meses grátis",
                            "Acesso a recursos beta",
                            "Dados de exportação avançados",
                            "Suporte VIP"
                          ]}
                          discountLabel={`Economize ${currencyFormatter.format(prices.yearly.savings)}`}
                          onSelect={handlePayment}
                          isLoading={isLoading}
                          isSelected={true}
                          isBestValue
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
            
            {/* Políticas e Termos */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Políticas e Termos</CardTitle>
                <CardDescription>
                  Informações importantes sobre sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Política de Reembolso</h3>
                  <p className="text-muted-foreground text-sm">
                    Reembolso disponível em até 7 dias após a contratação do serviço, desde que não 
                    tenha sido utilizado mais de 30% dos recursos disponíveis.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Termos de Serviço</h3>
                  <p className="text-muted-foreground text-sm">
                    Ao assinar nosso serviço, você concorda com os termos e condições estabelecidos, 
                    incluindo políticas de uso, privacidade e proteção de dados.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cancelamento</h3>
                  <p className="text-muted-foreground text-sm">
                    Você pode cancelar sua assinatura a qualquer momento. Ao cancelar, você manterá 
                    acesso até o fim do período já pago.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" onClick={() => window.open('#', '_blank')}>
                  Ver Termos Completos
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

interface PlanCardProps {
  title: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  discountLabel?: string;
  onSelect: () => void;
  isLoading: boolean;
  isSelected: boolean;
  isBestValue?: boolean;
}

function PlanCard({
  title,
  description,
  price,
  currency,
  interval,
  features,
  discountLabel,
  onSelect,
  isLoading,
  isSelected,
  isBestValue,
}: PlanCardProps) {
  return (
    <Card className={cn(
      "relative flex flex-col",
      isBestValue && "border-primary shadow-md"
    )}>
      {isBestValue && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
          Melhor valor
        </div>
      )}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mt-2 mb-6">
          <span className="text-4xl font-bold">
            {currencyFormatter.format(price)}
          </span>
          <span className="text-muted-foreground ml-2">
            /{interval}
          </span>
          {discountLabel && (
            <div className="mt-1 text-sm font-medium text-green-600">
              {discountLabel}
            </div>
          )}
        </div>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-4 w-4 text-green-500 mr-2 mt-1" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onSelect}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CreditCard className="mr-2 h-4 w-4" />
          Assinar Agora
        </Button>
      </CardFooter>
    </Card>
  );
}