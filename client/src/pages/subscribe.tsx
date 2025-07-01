import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from "lucide-react";

// Componente simplificado que sempre redireciona para checkout
export default function Subscribe() {
  const [_, navigate] = useLocation();
  
  useEffect(() => {
    // Redirecionar diretamente para a página de checkout
    navigate("/checkout");
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg">Redirecionando para checkout...</p>
    </div>
  );
}