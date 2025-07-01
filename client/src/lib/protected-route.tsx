import { useAuth } from "@/hooks/use-auth";
import { useDriverRegistration } from "@/hooks/use-driver-registration";
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
  const { needsDriverRegistration, isLoading: driverLoading } = useDriverRegistration();

  if (isLoading || driverLoading) {
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

  // Se usuário é motorista mas ainda não tem cadastro, redireciona para criar cadastro
  if (needsDriverRegistration && path !== '/drivers/new') {
    return (
      <Route path={path}>
        <Redirect to="/drivers/new" />
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
  if (user.profileType === "driver" || user.profileType === "motorista") {
    console.log(`Permitindo acesso ao motorista para a rota ${path}`);
    
    // Bloquear motoristas de acessar rotas de criação de fretes
    const blockedDriverRoutes = [
      '/freights/new',
      '/freights/create'
    ];
    
    if (blockedDriverRoutes.includes(path)) {
      console.log(`Motorista ${user.id} tentou acessar rota bloqueada: ${path}`);
      return (
        <Route path={path}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-bold mb-4 text-red-600">Acesso Restrito</h2>
              <p className="text-gray-600 mb-4">
                Motoristas não podem cadastrar fretes. Você pode apenas visualizar e gerenciar fretes existentes.
              </p>
              <button 
                onClick={() => window.history.back()} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Voltar
              </button>
            </div>
          </div>
        </Route>
      );
    }
    
    // Permite acesso às outras rotas para motoristas
    return <Route path={path} component={Component} />;
  }

  // Para outros tipos de usuários
  console.log(`Permitindo acesso ao usuário ${user.profileType} para a rota ${path}`);
  
  // Verifica se o usuário tem uma assinatura ativa
  if (user.subscriptionActive === false) {
    console.log("Usuário sem assinatura ativa, redirecionando para página interna de assinatura");
    
    // Lista de páginas que podem ser acessadas sem assinatura ativa
    const allowedPaths = [
      "/auth", 
      "/reset-password", 
      "/payment-success", 
      "/payment-cancel", 
      "/subscribe", 
      "/subscribe/fixed",
      "/subscribe/plans"
    ];
    
    if (allowedPaths.includes(path)) {
      console.log(`Permitindo acesso à rota permitida: ${path}`);
      return <Route path={path} component={Component} />;
    }
    
    // Redirecionar para a página interna de gerenciamento de assinatura
    console.log("Redirecionando para página interna de gerenciamento de assinatura");
    
    // Usar Redirect para manter a navegação interna
    return (
      <Route path={path}>
        <Redirect to="/subscribe" />
      </Route>
    );
  }
  
  // Verifica se o usuário tem assinatura, mas está expirada (exceto para driver_free)
  // Usamos "as any" temporariamente para contornar problemas de TypeScript com a definição de usuário
  const userAny = user as any;
  
  if ((userAny.subscriptionType === "trial" || userAny.subscriptionType === "monthly" || userAny.subscriptionType === "annual") && 
      userAny.subscriptionExpiresAt) {
    
    const subscriptionEndDate = new Date(userAny.subscriptionExpiresAt);
    const currentDate = new Date();
    
    console.log(`Verificando expiração: Data atual ${currentDate.toISOString()}, Data fim: ${subscriptionEndDate.toISOString()}`);
    
    // Se a data de expiração for anterior à data atual, a assinatura expirou
    if (subscriptionEndDate < currentDate) {
      console.log("Assinatura expirada, verificando se tem stripe customer ID");
      
      // Lista de páginas que podem ser acessadas mesmo com assinatura expirada
      const allowedPaths = [
        "/auth", 
        "/reset-password", 
        "/payment-success", 
        "/payment-cancel", 
        "/subscribe", 
        "/subscribe/fixed",
        "/subscribe/plans"
      ];
      
      if (allowedPaths.includes(path)) {
        console.log(`Permitindo acesso à rota permitida: ${path}`);
        return <Route path={path} component={Component} />;
      }
      
      // Redirecionar para a página interna de gerenciamento de assinatura
      console.log("Assinatura expirada, redirecionando para página interna de gerenciamento");
      
      // Usar Redirect para manter a navegação interna
      return (
        <Route path={path}>
          <Redirect to="/subscribe" />
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}