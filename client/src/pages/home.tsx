import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CarFront, Users, BarChart3, ClipboardList, Truck, Building2, AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Verifica se o usuário tem uma assinatura expirada
  const hasExpiredSubscription = user && !user.subscriptionActive && user.paymentRequired;
  // Calcula se está em período de teste
  const isInTrial = user?.subscriptionType === "trial" && user?.subscriptionActive === true;
  // Calcula dias restantes do período de teste
  const calculateRemainingDays = () => {
    if (!user?.subscriptionExpiresAt) return null;
    const expirationDate = new Date(user.subscriptionExpiresAt);
    const currentDate = new Date();
    const timeDiff = expirationDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };
  
  const remainingDays = calculateRemainingDays();
  
  return (
    <div className="space-y-6">
      {/* Alerta de assinatura expirada */}
      {hasExpiredSubscription && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Assinatura expirada</AlertTitle>
          <AlertDescription>
            Sua assinatura expirou. Para continuar usando o sistema completo, é necessário renovar sua assinatura.
            <Button 
              variant="destructive" 
              size="sm" 
              className="mt-2"
              onClick={() => setLocation("/checkout")}
            >
              Renovar agora
            </Button>
          </AlertDescription>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2" 
            onClick={(e) => {
              e.currentTarget.parentElement?.classList.add('hidden');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
      
      {/* Alerta de período de teste */}
      {isInTrial && remainingDays !== null && (
        <Alert variant={remainingDays <= 2 ? "destructive" : "default"} className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Período de teste</AlertTitle>
          <AlertDescription>
            Você está usando o período de teste gratuito. 
            Restam <strong>{remainingDays}</strong> dia{remainingDays !== 1 ? 's' : ''}.
            {remainingDays <= 2 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setLocation("/checkout")}
              >
                Assinar agora
              </Button>
            )}
          </AlertDescription>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2" 
            onClick={(e) => {
              e.currentTarget.parentElement?.classList.add('hidden');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
      
      <div className="text-center max-w-3xl mx-auto py-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
            Sistema de Gestão de Fretes
          </span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gerencie de forma eficiente motoristas, veículos, fretes e clientes com nosso sistema completo.
        </p>
      </div>

      {/* Card especial para motoristas - Otimizado para mobile */}
      <Card className="mb-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700">
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-lg sm:text-xl flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
            <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
            MOTORISTA NÃO PAGA
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-300 text-sm sm:text-base">
            Se você é motorista, cadastre-se gratuitamente!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-0">
          <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mb-4 px-2">
            Motoristas têm acesso gratuito ao sistema para gerenciar seus veículos e consultar fretes disponíveis.
          </p>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto px-4 sm:px-8 py-2 text-sm sm:text-base font-semibold"
            onClick={() => setLocation("/profile-selection")}
          >
            <span className="block sm:hidden">Sou motorista, CLIQUE AQUI</span>
            <span className="hidden sm:block">Se você é motorista, CLIQUE AQUI</span>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Motoristas
            </CardTitle>
            <CardDescription>
              Gerenciar motoristas
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Cadastre, edite e gerencie motoristas e seus documentos.
            </p>
            <Link href="/drivers">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <CarFront className="h-5 w-5 text-primary" />
              Veículos
            </CardTitle>
            <CardDescription>
              Gerenciar veículos
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Cadastre e gerencie os veículos para fretes.
            </p>
            <Link href="/vehicles">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Fretes
            </CardTitle>
            <CardDescription>
              Gerenciar fretes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Cadastre e acompanhe fretes e suas cargas.
            </p>
            <Link href="/freights">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Clientes
            </CardTitle>
            <CardDescription>
              Gerenciar clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Cadastre e gerencie seus clientes e parceiros.
            </p>
            <Link href="/clients">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Dashboard
            </CardTitle>
            <CardDescription>
              Dados e estatísticas
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Visualize métricas e indicadores de desempenho.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Relatórios
            </CardTitle>
            <CardDescription>
              Gerar relatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Gere relatórios personalizados para análise.
            </p>
            <Link href="/reports">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
