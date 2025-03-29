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
    '/freights', 
    '/dashboard'
  ]
};

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
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

  // Se não houver usuário, redireciona para a autenticação
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Se o usuário for admin, permite acesso independente da assinatura
  if (user.profileType === "admin") {
    return <Route path={path} component={Component} />;
  }

  // Verifica se o usuário tem uma assinatura ativa
  if (!user.subscriptionActive) {
    return (
      <Route path={path}>
        <Redirect to="/auth?subscription=required" />
      </Route>
    );
  }

  // Verifica se é usuário com assinatura do tipo motorista gratuito
  if (user.subscriptionType === "driver_free") {
    // Verifica se o caminho atual é permitido para motoristas
    const isPathAllowed = LIMITED_ROUTES.driver_free.some(route => {
      // Verifica se o path atual começa com alguma das rotas permitidas
      return path === route || (route.endsWith('/') && path.startsWith(route));
    });

    if (!isPathAllowed) {
      return (
        <Route path={path}>
          <Redirect to="/dashboard" />
        </Route>
      );
    }
  }

  // Verifica se o período de teste gratuito expirou
  if (user.subscriptionType === "trial" && user.subscriptionEndDate) {
    const endDate = new Date(user.subscriptionEndDate);
    const now = new Date();
    
    if (now > endDate) {
      // Período de teste expirado
      return (
        <Route path={path}>
          <Redirect to="/auth?subscription=required" />
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}