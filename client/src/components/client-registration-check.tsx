import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

/**
 * Componente que verifica se o usuário tem um cliente associado.
 * Se não tiver, redireciona para a página de criação de cliente.
 */
export function ClientRegistrationCheck() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Ignore for admin users or if no user logged in
    if (!user || user.profileType === 'admin') return;
    
    // If user has no clientId associated, redirect to client creation
    if (!user.clientId) {
      // Ignore if already on the client/new page or auth page
      if (window.location.pathname === '/clients/new' || window.location.pathname === '/auth') return;
      
      toast({
        title: "Cadastro de cliente obrigatório",
        description: "É necessário cadastrar um cliente para continuar utilizando o sistema.",
        variant: "default",
      });
      
      setLocation("/clients/new");
    }
  }, [user, setLocation, toast]);

  return null; // This component doesn't render anything
}