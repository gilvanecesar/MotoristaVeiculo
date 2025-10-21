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

  // Se não houver usuário, redireciona para a página de login
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }
  
  // Se o usuário for admin, permite acesso
  if (user.profileType === "administrador" || user.profileType === "admin") {
    return <Route path={path} component={Component} />;
  }

  // Essa verificação já foi feita acima

  // Verifica se o usuário é motorista (acesso gratuito)
  if (user.profileType === "driver" || user.profileType === "motorista") {
    // Motoristas não podem acessar a página "Meus Fretes"
    if (path === "/my-freights") {
      return (
        <Route path={path}>
          <Redirect to="/freights" />
        </Route>
      );
    }
    
    // Permite acesso à rota para motoristas - com restrições específicas
    return <Route path={path} component={Component} />;
  }
  
  // Verifica se o usuário tem uma assinatura ativa
  if (user.subscriptionActive === false) {
    // Lista de páginas que podem ser acessadas sem assinatura ativa
    const allowedPaths = [
      "/auth", 
      "/reset-password", 
      "/payment-success", 
      "/payment-cancel", 
      "/subscribe", 
      "/checkout",
      "/subscribe/plans"
    ];
    
    if (allowedPaths.includes(path)) {
      return <Route path={path} component={Component} />;
    }
    
    // Redirecionar para a página interna de gerenciamento de assinatura
    return (
      <Route path={path}>
        <Redirect to="/subscribe" />
      </Route>
    );
  }
  
  // Verifica se o usuário tem assinatura, mas está expirada (exceto para driver_free)
  // Usamos "as any" temporariamente para contornar problemas de TypeScript com a definição de usuário
  const userAny = user as any;
  
  if ((userAny.subscriptionType === "monthly" || userAny.subscriptionType === "annual") && 
      userAny.subscriptionExpiresAt) {
    
    const subscriptionEndDate = new Date(userAny.subscriptionExpiresAt);
    const currentDate = new Date();
    
    // Se a data de expiração for anterior à data atual, a assinatura expirou
    if (subscriptionEndDate < currentDate) {
      // Lista de páginas que podem ser acessadas mesmo com assinatura expirada
      const allowedPaths = [
        "/auth", 
        "/reset-password", 
        "/payment-success", 
        "/payment-cancel", 
        "/subscribe", 
        "/subscribe/plans"
      ];
      
      if (allowedPaths.includes(path)) {
        return <Route path={path} component={Component} />;
      }
      
      // Redirecionar para a página interna de gerenciamento de assinatura
      return (
        <Route path={path}>
          <Redirect to="/subscribe" />
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}