import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LayoutDashboard, Users, Car, BarChart3, Menu, X, Moon, Sun, Truck, Building2, Home, DollarSign, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme-provider";
import { useClientAuth } from "@/lib/auth-context";
import { useAuth } from "@/hooks/use-auth";
import { ClientSelector } from "@/components/client-selector";
import { PaymentBanner } from "@/components/payment-banner";
import logoImage from "../../assets/logo.png";
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
    label: "Home", 
    path: "/",
    icon: Home
  },
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
  const { user, logoutMutation } = useAuth();
  
  // Função para fazer logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Verificar se o usuário é administrador
  const isAdmin = user?.profileType === "admin";
  const isDriver = user?.profileType === "driver";
  const isShipper = user?.profileType === "shipper";
  const isAgent = user?.profileType === "agent";
  
  // Menus administrativos (apenas para administradores)
  const financeMenuItem = {
    label: "Financeiro",
    path: "/admin/finance",
    icon: DollarSign
  };
  
  const usersMenuItem = {
    label: "Usuários",
    path: "/admin/users",
    icon: UserCog
  };
  
  // Items do menu com base nas permissões
  let menuItems = [];
  
  // Menu Home sempre visível para todos
  menuItems.push(navItems[0]); // Home
  
  if (user) {
    // Menus baseados no tipo de perfil
    if (isAdmin) {
      // Admins veem tudo
      menuItems = [...navItems];
      // Adicionamos os menus administrativos
      menuItems.push(financeMenuItem, usersMenuItem);
    } else if (isDriver) {
      // Motoristas veem home, fretes disponíveis, seus dados e seus veículos
      menuItems = [
        navItems[0],  // Home
        navItems[2],  // Motoristas (seus dados)
        navItems[3],  // Veículos
        navItems[4]   // Fretes
      ];
    } else if (isShipper) {
      // Embarcadores podem criar e gerenciar fretes, ver motoristas
      menuItems = [
        navItems[0],  // Home
        navItems[2],  // Motoristas
        navItems[4],  // Fretes
        navItems[5],  // Clientes
        navItems[6]   // Relatórios
      ];
    } else if (isAgent) {
      // Transportadoras podem gerenciar motoristas, veículos e fretes
      menuItems = [
        navItems[0],  // Home
        navItems[2],  // Motoristas
        navItems[3],  // Veículos
        navItems[4],  // Fretes
        navItems[5],  // Clientes
        navItems[6]   // Relatórios
      ];
    } else {
      // Perfil não definido ainda - mostrar apenas home 
      // (usuário provavelmente será redirecionado para seleção de perfil)
      menuItems = [navItems[0]]; // Apenas Home
    }
  }
  
  // Remover duplicatas usando um Map para garantir chaves únicas
  const uniqueMenuItems = Array.from(
    new Map(menuItems.map(item => [item.path, item])).values()
  );
  
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
      case "/admin/finance":
        return "Gestão Financeira";
      case "/admin/finance/settings":
        return "Configurações Financeiras";
      case "/admin/users":
        return "Gerenciamento de Usuários";
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
        return "QUERO FRETES";
    }
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto">
        {/* Menu Bar with Logo and Navigation Items */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
          {/* Logo */}
          <div className="flex items-center gap-1 sm:gap-2">
            <img src={logoImage} alt="QUERO FRETES" className="h-8 w-8 sm:h-10 sm:w-10" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text">QUERO FRETES</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">Sistema de gerenciamento de cargas</p>
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
            {uniqueMenuItems.map((item) => {
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

          {/* Theme Toggle + Client Selector */}
          <div className="hidden md:flex items-center gap-2">
            {/* Client Selector */}
            <ClientSelector />
            
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
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Perfil</DropdownMenuItem>
                <DropdownMenuItem>Configurações</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation Menu - Dropdown */}
        {isMobile && mobileMenuOpen && (
          <nav className="md:hidden pb-3 px-4 border-t border-slate-100 dark:border-slate-600">
            <ul className="pt-2 space-y-1">
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
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user?.name || 'Usuário'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'email@exemplo.com'}</p>
                  </div>
                </div>
              </li>
              
              {/* Logout Button for Mobile */}
              <li>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-start gap-3 w-full px-3 py-2 rounded-md transition-all text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Sair</span>
                </button>
              </li>
            </ul>
          </nav>
        )}
        
        {/* Mobile Bottom Navigation Bar */}
        {isMobile && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-50 shadow-lg">
            <div className={`grid ${uniqueMenuItems.length <= 5 ? `grid-cols-${uniqueMenuItems.length}` : 'grid-cols-5'} h-16`}>
              {uniqueMenuItems.slice(0, 5).map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`
                        flex flex-col items-center justify-center h-full transition-all duration-200 cursor-pointer
                        ${isActive
                          ? "text-primary"
                          : "text-slate-600 dark:text-slate-300"}
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Page Title Bar - Shows the current page title */}
        <div className="bg-slate-50 dark:bg-slate-700 px-4 py-2 border-t border-b border-slate-200 dark:border-slate-600">
          <h2 className="text-md font-semibold text-slate-700 dark:text-slate-200">{getPageTitle()}</h2>
        </div>

        {/* Banner de pagamento removido conforme solicitado */}
      </div>
    </header>
  );
}
