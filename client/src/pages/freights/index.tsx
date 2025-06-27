import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FreightsPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log("Página de fretes (redirecionamento) carregada");
  }, []);

  const handleRedirect = () => {
    setLocation("/my-freights");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Package className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Fretes</CardTitle>
            <CardDescription>
              Toda funcionalidade de fretes foi movida para "Meus Fretes"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleRedirect}
              className="w-full"
              size="lg"
            >
              Ir para Meus Fretes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}