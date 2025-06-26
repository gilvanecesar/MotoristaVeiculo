import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  LayoutDashboard, Users, Car, BarChart3, Menu, X, Moon, Sun, Truck, 
  Building2, Home, DollarSign, UserCog, Settings, User, CreditCard,
  Receipt, CalendarClock, AlertCircle, Bell, Webhook, Package, LogOut,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { ClientSelector } from "@/components/client-selector";
import { useToast } from "@/hooks/use-toast";
import logoImage from "../../assets/logo.png";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navItems = [
  { 
    label: "Home", 
    path: "/home",
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
    label: "Complementos", 
    path: "/complements",
    icon: Package
  },
  { 
    label: "Relatórios", 
    path: "/reports",
    icon: BarChart3
  },
];

const adminItems = [
  {
    label: "Usuários",
    path: "/admin/users",
    icon: UserCog
  },
  {
    label: "Financeiro",
    path: "/admin/finance",
    icon: DollarSign
  },
  {
    label: "Webhooks",
    path: "/admin/webhooks",
    icon: Webhook
  },
  {
    label: "Configurações",
    path: "/admin/settings",
    icon: Settings
  }
];

const subscriptionItems = [
  {
    label: "Minha Assinatura",
    path: "/subscription-status",
    icon: CreditCard
  },
  {
    label: "Histórico",
    path: "/subscription-history",
    icon: CalendarClock
  },
  {
    label: "Faturas",
    path: "/invoices",
    icon: Receipt
  }
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  const [_, navigate] = useLocation();
  
  const handleLogout = () => {
    try {
      logoutMutation.mutate(undefined, {
        onSuccess: () => {
          console.log("Logout efetuado com sucesso");
          localStorage.removeItem('currentClientId');
          navigate('/auth');
        },
        onError: (error) => {
          console.error("Erro ao fazer logout:", error);
        }
      });
    } catch (error) {
      console.error("Erro ao processar logout:", error);
    }
  };
  
  // Verificar o tipo de perfil do usuário
  const isAdmin = user?.profileType === "administrador" || user?.profileType === "admin";
  const isDriver = user?.profileType === "motorista" || user?.profileType === "driver";
  const isShipper = user?.profileType === "embarcador" || user?.profileType === "shipper";
  const isAgent = user?.profileType === "agente" || user?.profileType === "agent";
  
  // Lógica para mostrar/ocultar menus baseado no perfil
  const userDataForMenus = {
    id: user?.id,
    profileType: user?.profileType,
    clientId: user?.clientId,
    subscriptionActive: user?.subscriptionActive,
    subscriptionType: user?.subscriptionType,
    subscriptionExpiresAt: user?.subscriptionExpiresAt
  };
  
  console.log("Dados do usuário para menus:", userDataForMenus);
  
  // Determinar quais menus mostrar
  let showAllMenus = false;
  let showLimitedMenus = false;
  
  if (isAdmin) {
    showAllMenus = true;
  } else if (user?.clientId) {
    console.log("Usuário com cliente cadastrado - mostrando todos os menus");
    showAllMenus = true;
  } else if (isDriver) {
    console.log("Usuário motorista sem cliente - mostrando menus limitados");
    showLimitedMenus = true;
  } else {
    console.log("Outros casos - mostrando todos os menus");
    showAllMenus = true;
  }
  
  // Filtrar menus baseado no perfil
  const availableNavItems = showLimitedMenus 
    ? navItems.filter(item => ["Motoristas", "Veículos", "Relatórios"].includes(item.label))
    : navItems;

  const isActive = (path: string) => {
    if (path === '/home' && location === '/') return true;
    return location === path || location.startsWith(path + '/');
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-background border-r border-border h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        isMobile && "fixed inset-y-0 left-0 z-50 transform",
      )}
    >
      {/* Header da Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <img 
              src={logoImage} 
              alt="QUERO FRETES" 
              className="h-8 w-auto"
            />
            <span className="font-bold text-lg text-primary">QUERO FRETES</span>
          </div>
        )}
        
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navegação Principal */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {/* Menus principais */}
          {availableNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    collapsed && "justify-center px-2",
                    active && "bg-secondary text-secondary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          })}
          
          {/* Separador */}
          {(isAdmin || (!isDriver && user?.subscriptionActive)) && (
            <div className="my-4 border-t border-border" />
          )}
          
          {/* Menus de assinatura */}
          {!isDriver && user?.subscriptionActive && !collapsed && (
            <>
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Assinatura
                </h3>
              </div>
              {subscriptionItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={active ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        active && "bg-secondary text-secondary-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </>
          )}
          
          {/* Menus administrativos */}
          {isAdmin && (
            <>
              {!collapsed && (
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Administração
                  </h3>
                </div>
              )}
              {adminItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={active ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        collapsed && "justify-center px-2",
                        active && "bg-secondary text-secondary-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Button>
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </div>

      {/* Cliente Selector (se não for admin e tiver cliente) */}
      {!isAdmin && user?.clientId && !collapsed && (
        <div className="p-3 border-t border-border">
          <ClientSelector />
        </div>
      )}

      {/* Footer da Sidebar - Usuário */}
      <div className="p-3 border-t border-border">
        {collapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full p-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    Modo Claro
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    Modo Escuro
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.profileType === 'admin' ? 'Administrador' : 
                   user?.profileType === 'shipper' ? 'Embarcador' :
                   user?.profileType === 'driver' ? 'Motorista' :
                   user?.profileType === 'agent' ? 'Agente' : 
                   user?.profileType}
                </p>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="flex-1"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex-1"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}