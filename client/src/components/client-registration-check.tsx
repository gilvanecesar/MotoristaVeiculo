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
    
    // If user has no clientId associated, show dialog or redirect directly
    if (!user.clientId) {
      // Ignore if already on the client/new page, auth page, or subscription pages
      const ignorePaths = [
        '/clients/new', 
        '/auth', 
        '/subscribe', 
        '/subscribe/fixed', 
        '/subscribe/plans',
        '/payment-success',
        '/payment-cancel',
        '/profile-selection'
      ];
      
      const currentPath = window.location.pathname;
      if (ignorePaths.some(path => currentPath.startsWith(path))) return;
      
      // If user has active subscription but no client, force redirect to client form
      if (user.subscriptionActive) {
        setLocation("/clients/new");
        return;
      }
      
      // For users without subscription, show dialog to complete registration
      const hasShownDialog = sessionStorage.getItem('clientDialogShown');
      if (!hasShownDialog) {
        setShowDialog(true);
        sessionStorage.setItem('clientDialogShown', 'true');
      }
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