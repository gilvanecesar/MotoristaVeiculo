import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

/**
 * Hook para verificar se um agenciador precisa cadastrar um cliente
 * antes de acessar outras funcionalidades do sistema
 */
export function useAgentClientCheck() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const isAgenciador = user?.profileType === 'agenciador';
  const hasClient = !!user?.clientId;
  const needsClientRegistration = isAgenciador && !hasClient;

  /**
   * Verifica se o agenciador pode acessar uma rota específica
   * Se não puder, exibe uma mensagem e redireciona para cadastro de cliente
   */
  const checkClientAccess = (routeName: string = "essa funcionalidade") => {
    if (needsClientRegistration) {
      toast({
        title: "Cadastro de cliente necessário",
        description: `Para acessar ${routeName}, você precisa primeiro cadastrar um cliente.`,
        variant: "destructive",
      });
      
      // Redirecionar para a página de cadastro de cliente
      setTimeout(() => {
        navigate("/clients/new");
      }, 1500);
      
      return false;
    }
    return true;
  };

  /**
   * Função para usar em onClick de botões/links
   * Previne a navegação se o agenciador não tiver cliente
   */
  const handleProtectedClick = (callback: () => void, routeName?: string) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      if (checkClientAccess(routeName)) {
        callback();
      }
    };
  };

  return {
    isAgenciador,
    hasClient,
    needsClientRegistration,
    checkClientAccess,
    handleProtectedClick,
  };
}