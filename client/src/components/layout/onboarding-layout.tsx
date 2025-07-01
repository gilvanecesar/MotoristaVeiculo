import { useLocation } from "wouter";
import { Bell, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import logoQueroFretes from "@assets/QUEROFRETES BOLINHA.png";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/auth");
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simplificado */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoQueroFretes} alt="QUERO FRETES" className="h-8" />
          <span className="text-lg font-semibold text-gray-900">QUERO FRETES</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Botão Minha Assinatura - único disponível durante onboarding */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/invoices/fixed")}
            className="hidden sm:flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Minha Assinatura
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Minha Assinatura - visível em mobile */}
              <DropdownMenuItem 
                className="sm:hidden"
                onClick={() => setLocation("/invoices/fixed")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Minha Assinatura</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem onClick={handleLogout}>
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Alerta de progresso de cadastro */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Complete seu cadastro</span> para acessar todos os recursos da plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}