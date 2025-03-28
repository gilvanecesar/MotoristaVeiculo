import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Header() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  
  // Map location to page title
  const getPageTitle = () => {
    switch (location) {
      case "/dashboard":
        return "Dashboard";
      case "/drivers":
        return "Motoristas";
      case "/vehicles":
        return "Veículos";
      case "/reports":
        return "Relatórios";
      default:
        if (location.startsWith("/drivers/new")) {
          return "Cadastrar Motorista";
        } else if (location.startsWith("/drivers/")) {
          return "Detalhes do Motorista";
        }
        return "Sistema de Gestão de Fretes";
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className={`${isMobile ? 'container mx-auto' : ''} px-6 py-4 flex justify-between items-center`}>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{getPageTitle()}</h1>
          <p className="text-sm text-slate-500">Sistema de Gestão de Fretes</p>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-slate-600 hover:text-primary outline-none">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    AD
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuItem>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
