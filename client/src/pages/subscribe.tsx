import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from "lucide-react";

// Componente simplificado que apenas redireciona para a página fixa
export default function Subscribe() {
  const [_, navigate] = useLocation();
  
  useEffect(() => {
    // Redirecionar para a página fixa de assinatura
    navigate("/subscribe/fixed");
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg">Carregando opções de assinatura...</p>
    </div>
  );
}