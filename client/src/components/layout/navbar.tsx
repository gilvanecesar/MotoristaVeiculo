import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  LayoutDashboard, Users, Car, BarChart3, Menu, X, Moon, Sun, Truck, 
  Building2, Home, DollarSign, UserCog, Settings, CreditCard,
  Receipt, Webhook, Package, LogOut, MessageCircle, FileText, Calculator, Bot, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useAgentClientCheck } from "@/hooks/use-agent-client-check";
import logoImage from "../../assets/logo.png";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", path: "/home", icon: Home },
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Motoristas", path: "/drivers", icon: Users },
  { label: "Veículos", path: "/vehicles", icon: Car },
  { label: "Fretes", path: "/freights", icon: Truck },
  { label: "Meus Fretes", path: "/my-freights", icon: Package },
  { label: "Cadastro", path: "/clients", icon: Building2 },
  { label: "Complementos", path: "/complements", icon: Package },
  { label: "Cotações", path: "/quotes", icon: FileText },
  { label: "Calculadora ANTT", path: "/antt-calculator", icon: Calculator },
  { label: "Buzino - IA", path: "/ai-assistant", icon: Bot },
  { label: "Relatórios", path: "/reports", icon: BarChart3 },
];

const adminItems = [
  { label: "Usuários", path: "/admin/users", icon: UserCog },
  { label: "Cotações", path: "/admin/quotes", icon: FileText },
  { label: "Financeiro", path: "/admin/finance", icon: DollarSign },
  { label: "Webhooks", path: "/admin/webhooks", icon: Webhook },
  { label: "WhatsApp Config", path: "/admin/whatsapp", icon: MessageCircle },
  { label: "OpenPix", path: "/admin/openpix", icon: CreditCard },
  { label: "Configurações", path: "/admin/settings", icon: Settings }
];

const subscriptionItems = [
  { label: "Minha Assinatura", path: "/subscription-status", icon: CreditCard },
  { label: "Faturas", path: "/invoices", icon: Receipt }
];

export default function Navbar() {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const { needsClientRegistration, handleProtectedClick } = useAgentClientCheck();
  
  const handleLogout = () => {
    try {
      logoutMutation.mutate(undefined, {
        onSuccess: () => {
          localStorage.removeItem('currentClientId');
          navigate('/auth');
        }
      });
    } catch (error) {
      // Erro silencioso - apenas redireciona para login
      navigate('/auth');
    }
  };
  
  const isAdmin = user?.profileType === "administrador" || user?.profileType === "admin";
  const isDriver = user?.profileType === "motorista" || user?.profileType === "driver";
  const isShipper = user?.profileType === "embarcador" || user?.profileType === "shipper";
  const isAgent = user?.profileType === "agenciador" || user?.profileType === "agent" || user?.profileType === "agente";
  const isTransportador = user?.profileType === "transportador";
  
  let showAllMenus = false;
  let showLimitedMenus = false;
  
  if (isAdmin) {
    showAllMenus = true;
  } else if (user?.clientId) {
    showAllMenus = true;
  } else if (isDriver) {
    showLimitedMenus = true;
  } else {
    showAllMenus = true;
  }
  
  let availableNavItems = navItems;
  
  if (showLimitedMenus) {
    availableNavItems = navItems.filter(item => ["Motoristas", "Veículos", "Fretes", "Relatórios", "Calculadora ANTT"].includes(item.label));
  } else if (isTransportador || isShipper || isAgent || isAdmin) {
    availableNavItems = navItems;
  } else {
    availableNavItems = navItems.filter(item => item.label !== "Cotações");
  }

  const isActive = (path: string) => {
    if (path === '/home' && location === '/') return true;
    return location === path || location.startsWith(path + '/');
  };

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    const shouldBlock = needsClientRegistration && item.path !== "/clients/new" && item.path !== "/clients";

    if (shouldBlock) {
      return (
        <Button
          variant="ghost"
          className="text-white/40 cursor-not-allowed opacity-50"
          onClick={handleProtectedClick(() => {}, item.label)}
        >
          <Icon className="h-4 w-4 mr-2" />
          {item.label}
        </Button>
      );
    }

    return (
      <Link href={item.path}>
        <Button
          variant={active ? "secondary" : "ghost"}
          className={cn(
            "text-white/80 hover:text-white hover:bg-cyan-500/50 transition-all duration-200",
            active && "bg-cyan-400 text-cyan-900 hover:bg-cyan-400/90"
          )}
        >
          <Icon className="h-4 w-4 mr-2" />
          {item.label}
        </Button>
      </Link>
    );
  };

  // Mobile Menu
  const MobileMenu = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-[#00222d] border-gray-700">
        <SheetHeader>
          <SheetTitle className="text-white text-left">Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-1">
          {availableNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const shouldBlock = needsClientRegistration && item.path !== "/clients/new" && item.path !== "/clients";

            if (shouldBlock) {
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className="w-full justify-start text-white/40 cursor-not-allowed opacity-50"
                  onClick={handleProtectedClick(() => {}, item.label)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            }

            return (
              <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-white/80 hover:text-white hover:bg-cyan-500/50",
                    active && "bg-cyan-400 text-cyan-900"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs text-white/60 font-semibold uppercase px-2">Administração</p>
              </div>
              {adminItems.map((item) => (
                <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-white/80 hover:text-white hover:bg-gray-700/50",
                      isActive(item.path) && "bg-gray-600 text-white"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-[#00222d] border-gray-300/20">
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Logo */}
        <Link href="/home">
          <div className="flex items-center space-x-2 cursor-pointer">
            <img src={logoImage} alt="QUERO FRETES" className="h-8 w-auto" />
            <span className="font-bold text-lg text-white hidden sm:inline">QUERO FRETES</span>
          </div>
        </Link>

        {/* Mobile Menu */}
        <MobileMenu />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center flex-1 gap-1 ml-6">
          {availableNavItems.slice(0, 6).map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
          
          {/* Mais opções dropdown */}
          {availableNavItems.length > 6 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-cyan-500/50">
                  Mais
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {availableNavItems.slice(6).map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link href={item.path}>
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right side - Admin Menu & User Menu */}
        <div className="ml-auto flex items-center gap-2">
          {/* Admin Menu */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:flex text-white/80 hover:text-white hover:bg-gray-700/50">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Administração</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link href={item.path}>
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-white/70 hover:text-white hover:bg-gray-600/50"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-white">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-cyan-600 text-white">
                    {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline text-sm">{user?.name || user?.email}</span>
                <ChevronDown className="h-4 w-4 hidden lg:inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user?.name || user?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.profileType === 'administrador' ? 'Administrador' : 
                     user?.profileType === 'embarcador' ? 'Embarcador' :
                     user?.profileType === 'motorista' ? 'Motorista' :
                     user?.profileType === 'agenciador' ? 'Agenciador' :
                     user?.profileType === 'transportador' ? 'Transportador' : 
                     user?.profileType}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {!isDriver && user?.subscriptionActive && (
                <>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Assinatura
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {subscriptionItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem key={item.path} asChild>
                            <Link href={item.path}>
                              <Icon className="h-4 w-4 mr-2" />
                              {item.label}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {!isDriver && !isAdmin && user?.subscriptionActive && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/webhook-config">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp Config
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
