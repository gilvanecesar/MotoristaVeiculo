import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LayoutDashboard, Users, Car, BarChart3, Menu, X, Moon, Sun, Truck, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme-provider";
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
    label: "Fretes", 
    path: "/freights",
    icon: Truck
  },
  { 
    label: "Clientes", 
    path: "/clients",
    icon: Building2
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
  const { theme, toggleTheme } = useTheme();
  
  // Map location to page title
  const getPageTitle = () => {
    switch (location) {
      case "/dashboard":
        return "Dashboard";
      case "/drivers":
        return "Motoristas";
      case "/vehicles":
        return "Veículos";
      case "/freights":
        return "Fretes";
      case "/clients":
        return "Clientes";
      case "/reports":
        return "Relatórios";
      default:
        if (location.startsWith("/drivers/new")) {
          return "Cadastrar Motorista";
        } else if (location.startsWith("/drivers/")) {
          return "Detalhes do Motorista";
        } else if (location.startsWith("/freights/new")) {
          return "Cadastrar Frete";
        } else if (location.startsWith("/freights/")) {
          return "Detalhes do Frete";
        } else if (location.startsWith("/clients/new")) {
          return "Cadastrar Cliente";
        } else if (location.startsWith("/clients/")) {
          return "Detalhes do Cliente";
        }
        return "Sistema de Gestão de Frotas";
    }
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto">
        {/* Menu Bar with Logo and Navigation Items */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-white">Gestão de Frotas</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">Sistema de gerenciamento</p>
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
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}
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

          {/* Theme Toggle + User Profile */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
              className="text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100/80 dark:hover:bg-slate-700/80"
            >
              {theme === 'light' ? (
                <Moon className="theme-toggle-icon" /> 
              ) : (
                <Sun className="theme-toggle-icon" />
              )}
            </Button>
            
            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-slate-600 dark:text-slate-300 hover:text-primary outline-none">
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
          <nav className="md:hidden pb-3 px-4 border-t border-slate-100 dark:border-slate-600">
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
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}
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

              {/* Theme Toggle for Mobile */}
              <li>
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-start gap-3 w-full px-3 py-2 rounded-md transition-all text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="h-5 w-5" />
                      <span className="font-medium">Modo Escuro</span>
                    </>
                  ) : (
                    <>
                      <Sun className="h-5 w-5" />
                      <span className="font-medium">Modo Claro</span>
                    </>
                  )}
                </button>
              </li>
              
              {/* User Profile for Mobile */}
              <li className="pt-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Admin</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">admin@exemplo.com</p>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        )}

        {/* Page Title Bar - Shows the current page title */}
        <div className="bg-slate-50 dark:bg-slate-700 px-4 py-2 border-t border-b border-slate-200 dark:border-slate-600">
          <h2 className="text-md font-semibold text-slate-700 dark:text-slate-200">{getPageTitle()}</h2>
        </div>
      </div>
    </header>
  );
}
