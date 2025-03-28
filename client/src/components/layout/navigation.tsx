import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LayoutDashboard, Users, Car, BarChart3, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const navItems = [
  { 
    label: "Dashboard", 
    path: "/dashboard",
    icon: LayoutDashboard
  },
  { 
    label: "Motoristas", 
    path: "/drivers",
    icon: Users
  },
  { 
    label: "Veículos", 
    path: "/vehicles", 
    icon: Car
  },
  { 
    label: "Relatórios", 
    path: "/reports",
    icon: BarChart3
  },
];

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        return "Sistema de Gestão de Frotas";
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto">
        {/* Menu Bar with Logo and Navigation Items */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Gestão de Frotas</h1>
              <p className="text-xs text-slate-500 hidden md:block">Sistema de gerenciamento</p>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          {isMobile && (
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 cursor-pointer
                      ${isActive
                        ? "bg-primary/10 text-primary"
                        : "text-slate-600 hover:bg-slate-100"}
                    `}
                    title={item.label}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="hidden md:block">
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

        {/* Mobile Navigation Menu */}
        {isMobile && mobileMenuOpen && (
          <nav className="md:hidden pb-3 px-4 border-t border-slate-100">
            <ul className="pt-2 space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                
                return (
                  <li key={item.path}>
                    <Link href={item.path}>
                      <div
                        className={`
                          flex items-center justify-start gap-3 px-3 py-2 rounded-md transition-all duration-200 cursor-pointer
                          ${isActive
                            ? "bg-primary/10 text-primary"
                            : "text-slate-600 hover:bg-slate-100"}
                        `}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}

              {/* User Profile for Mobile */}
              <li className="pt-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Admin</p>
                    <p className="text-xs text-slate-500">admin@exemplo.com</p>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        )}

        {/* Page Title Bar - Shows the current page title */}
        <div className="bg-slate-50 px-4 py-2 border-t border-b border-slate-200">
          <h2 className="text-md font-semibold text-slate-700">{getPageTitle()}</h2>
        </div>
      </div>
    </header>
  );
}
