import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

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

  return <Route path={path} component={Component} />;
}