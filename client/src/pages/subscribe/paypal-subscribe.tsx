import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FaShieldAlt, FaCheckCircle } from "react-icons/fa";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import PayPalButton from "@/components/ui/paypal-button";

export default function PayPalSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useLocation();

  const goToDashboard = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="container max-w-screen-lg mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">Assinar com PayPal</h1>
      <p className="text-lg text-center mb-8 text-muted-foreground">
        Escolha seu plano e pague com PayPal de forma simples e segura
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Plano Mensal */}
        <Card className="border-2 border-primary/30 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-primary/5 border-b border-primary/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">Plano Mensal</CardTitle>
              <span className="text-primary font-bold">R$ 99,90</span>
            </div>
            <CardDescription>Cobrança mensal, cancele quando quiser</CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <ul className="space-y-3">
              <li className="flex items-start">
                <FaCheckCircle className="text-green-500 mr-2 mt-1" />
                <span>Acesso a todas as funcionalidades da plataforma</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-green-500 mr-2 mt-1" />
                <span>Cadastro ilimitado de motoristas e veículos</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-green-500 mr-2 mt-1" />
                <span>Publicação de fretes ilimitados</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-green-500 mr-2 mt-1" />
                <span>Suporte prioritário</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex-col space-y-3 pt-0">
            <div className="w-full rounded-md bg-primary/10 p-4 flex items-center justify-center">
              <div 
                className="w-full h-12 bg-white rounded-md flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                style={{ maxWidth: "250px" }}
              >
                <PayPalButton
                  amount="99.90"
                  currency="BRL"
                  intent="CAPTURE"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              <FaShieldAlt className="inline mr-1" />
              Pagamento 100% seguro via PayPal
            </p>
          </CardFooter>
        </Card>

        {/* Plano Anual */}
        <Card className="border-2 border-primary shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-white text-xs py-1 px-3 rounded-bl-md font-medium">
            Economize 20%
          </div>
          <CardHeader className="bg-primary/5 border-b border-primary/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">Plano Anual</CardTitle>
              <div>
                <span className="text-primary font-bold">R$ 960,00</span>
                <p className="text-xs text-muted-foreground">R$ 80,00/mês</p>
              </div>
            </div>
            <CardDescription>Cobrança anual, melhor custo-benefício</CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <ul className="space-y-3">
              <li className="flex items-start">
                <FaCheckCircle className="text-green-500 mr-2 mt-1" />
                <span>Todas as vantagens do plano mensal</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-green-500 mr-2 mt-1" />
                <span>Economize 20% comparado ao plano mensal</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-green-500 mr-2 mt-1" />
                <span>Relatórios avançados</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-green-500 mr-2 mt-1" />
                <span>Suporte VIP</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex-col space-y-3 pt-0">
            <div className="w-full rounded-md bg-primary/10 p-4 flex items-center justify-center">
              <div 
                className="w-full h-12 bg-white rounded-md flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                style={{ maxWidth: "250px" }}
              >
                <PayPalButton 
                  amount="960.00"
                  currency="BRL"
                  intent="CAPTURE"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              <FaShieldAlt className="inline mr-1" />
              Pagamento 100% seguro via PayPal
            </p>
          </CardFooter>
        </Card>
      </div>

      <Separator className="my-8" />

      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Garantia de Satisfação</h2>
        <p className="text-muted-foreground mb-6">
          Teste o Quero Fretes por 7 dias grátis. Se não estiver satisfeito, cancele facilmente sem compromisso.
        </p>
        <Button variant="outline" onClick={() => setLocation("/subscribe")}>
          Ver outras opções de pagamento
        </Button>
      </div>
    </div>
  );
}