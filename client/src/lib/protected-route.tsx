import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// Definição de rotas por tipo de usuário
const LIMITED_ROUTES = {
  driver_free: [
    '/drivers', 
    '/drivers/new', 
    '/drivers/', 
    '/vehicles',
    '/vehicles/new',
    '/vehicles/',
    '/freights', 
    '/freights/',
    '/dashboard'
  ]
};

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Se não houver usuário, redireciona para a página de auth
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
  
  // Exibir log de debug para ajudar a identificar problemas de roteamento
  console.log(`Rota protegida: ${path}, Componente: ${Component.name || 'Unnamed'}, User: ${user.profileType}`);
  
  // Se o usuário for admin, permite acesso e informamos no log
  if (user.profileType === "admin") {
    console.log("Usuário é admin, autorizando acesso");
    return <Route path={path} component={Component} />;
  }

  // Essa verificação já foi feita acima

  // Verifica se o usuário é motorista (acesso gratuito)
  if (user.profileType === "driver") {
    console.log(`Permitindo acesso ao motorista para a rota ${path}`);
    // Permite acesso à rota para motoristas - removido as restrições para fins de teste
    return <Route path={path} component={Component} />;
  }

  // Para outros tipos de usuários
  console.log(`Permitindo acesso ao usuário ${user.profileType} para a rota ${path}`);
  
  // Para fins de teste, vamos permitir acesso a todas as rotas independente da assinatura
  
  // Comentamos a verificação de assinatura para permitir que todos acessem o sistema durante o desenvolvimento
  
  /*
  // Verifica se o usuário tem uma assinatura ativa
  if (!user.subscriptionActive) {
    // Vamos permitir acesso à página inicial mesmo sem assinatura ativa
    if (path === "/") {
      return <Route path={path} component={Component} />;
    }
    
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }
  */

  return <Route path={path} component={Component} />;
}