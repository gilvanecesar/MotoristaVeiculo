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
  
  // Verifica se o usuário tem uma assinatura ativa
  if (user.subscriptionActive === false) {
    console.log("Usuário sem assinatura ativa, verificando se é a página inicial");
    
    // Vamos permitir acesso à página inicial e à página de checkout mesmo sem assinatura ativa
    if (path === "/" || path === "/checkout") {
      console.log("Permitindo acesso à página inicial ou checkout");
      return <Route path={path} component={Component} />;
    }
    
    console.log("Redirecionando para a página inicial pois não tem assinatura ativa");
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }
  
  // Verifica se o usuário tem assinatura, mas está expirada (exceto para driver_free)
  // Usamos "as any" temporariamente para contornar problemas de TypeScript com a definição de usuário
  const userAny = user as any;
  
  if (userAny.subscriptionActive && 
      userAny.subscriptionType !== "driver_free" && 
      userAny.subscriptionExpiresAt) {
    
    const subscriptionEndDate = new Date(userAny.subscriptionExpiresAt);
    const currentDate = new Date();
    
    console.log(`Verificando expiração: Data atual ${currentDate.toISOString()}, Data fim: ${subscriptionEndDate.toISOString()}`);
    
    // Se a data de expiração for anterior à data atual, a assinatura expirou
    if (subscriptionEndDate < currentDate) {
      console.log("Assinatura expirada, redirecionando para home");
      
      // Permitir acesso à página inicial e checkout mesmo com assinatura expirada
      if (path === "/" || path === "/checkout") {
        return <Route path={path} component={Component} />;
      }
      
      return (
        <Route path={path}>
          <Redirect to="/" />
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}