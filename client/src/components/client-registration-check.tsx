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
    if (!user || user.profileType === 'admin') return;
    
    // If user has no clientId associated, show dialog
    if (!user.clientId) {
      // Ignore if already on the client/new page or auth page
      if (window.location.pathname === '/clients/new' || window.location.pathname === '/auth') return;
      
      // Show dialog only once per session
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
            Para utilizar todas as funcionalidades do sistema, é necessário preencher o cadastro do seu cliente na aba CLIENTE.
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