import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Icons } from "@/components/ui/icons";

/**
 * Componente que verifica se o usuário tem um cliente associado.
 * Se não tiver, mostra um pop-up informando para preencher o cadastro.
 */
export function ClientRegistrationCheck() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Ignore for admin users or if no user logged in
    if (!user || user.profileType === 'admin' || user.profileType === 'administrador') return;
    
    // Ignore se estiver na página de auth (login/registro)
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/auth') || currentPath === '/') return;
    
    // Verifica se o usuário é motorista (pode acessar sem assinatura)
    const isDriver = user.profileType === 'motorista' || user.profileType === 'driver';
    
    // Para embarcadores recém-cadastrados, verificar se está dentro do período de teste
    if (!user.subscriptionActive && !isDriver) {
      // Calcular se está dentro dos 7 dias de teste
      const createdAt = new Date(user.createdAt);
      const currentDate = new Date();
      const daysSinceCreated = Math.floor((currentDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Se ainda está dentro dos 7 dias de teste, permite continuar
      if (daysSinceCreated <= 7) {
        console.log(`Usuário embarcador dentro do período de teste: ${daysSinceCreated} dias desde o cadastro`);
        // Continua normalmente sem redirecionar para checkout
      } else {
        // Ignore se já estiver em páginas específicas
        const ignorePaths = [
          '/auth', 
          '/reset-password',
          '/payment-success',
          '/payment-cancel',
          '/subscribe',
          '/subscribe/fixed',
          '/subscribe/plans',
          '/checkout'
        ];
        
        const currentPath = window.location.pathname;
        if (ignorePaths.some(path => currentPath.startsWith(path))) return;
        
        // Redireciona para a página interna de gerenciamento de assinatura
        setLocation("/subscribe");
        return;
      }
    }
    
    // If user has no clientId associated, show dialog or redirect directly
    if (!user.clientId) {
      // Se for motorista, redireciona para a lista de fretes
      if (user.profileType === 'motorista' || user.profileType === 'driver') {
        // Ignore se já estiver na página de fretes
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/freights')) return;
        
        // Redireciona para a lista de fretes
        setLocation("/freights");
        return;
      }
      
      // Para outros perfis, verifica se tem assinatura ativa
      const currentPath = window.location.pathname;
      
      // Se tem assinatura ativa mas não tem cliente
      if (user.subscriptionActive) {
        // Ignore if already on the client/new page or home
        if (currentPath.startsWith('/clients/new') || currentPath === '/home') return;
        
        // Se tem assinatura mas não tem cliente, redireciona para o formulário de cliente
        setLocation("/clients/new");
        return;
      }
      
      // Ignore if already on the client/new page
      if (currentPath.startsWith('/clients/new')) return;
      
      // Se não tem assinatura nem cliente, redireciona para o formulário de cliente
      setLocation("/clients/new");
      return;
    }
  }, [user, setLocation]);

  const handleGoToClient = () => {
    setShowDialog(false);
    setLocation("/clients/new");
  };

  const handleClose = () => {
    setShowDialog(false);
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <Icons.error className="h-5 w-5 text-primary mr-2" />
            Cadastro de cliente obrigatório
          </AlertDialogTitle>
          <AlertDialogDescription>
            <strong className="text-primary">Atenção:</strong> Para utilizar a plataforma QUERO FRETES é necessário preencher o cadastro completo do cliente.
            <br/><br/>
            Sem este cadastro você não poderá acessar as funcionalidades do sistema.
            <br/><br/>
            Deseja ir para a página de cadastro agora?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Depois</AlertDialogCancel>
          <AlertDialogAction onClick={handleGoToClient}>Cadastrar agora</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}