import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Car, BarChart3, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  
  // Reset sidebar state when switching between mobile and desktop
  useEffect(() => {
    if (isMobile) {
      setCollapsed(false);
    }
  }, [isMobile]);

  // Width values for different states
  const desktopExpandedWidth = "w-64";
  const desktopCollapsedWidth = "w-16";
  const mobileWidth = mobileMenuOpen ? "w-64" : "w-0";
  
  // Calculate sidebar width based on state
  const sidebarWidth = isMobile 
    ? mobileWidth 
    : (collapsed ? desktopCollapsedWidth : desktopExpandedWidth);
  
  // Calculate content margin based on sidebar state
  const contentMargin = isMobile 
    ? "ml-0" 
    : (collapsed ? "ml-16" : "ml-64");

  return (
    <>
      {/* Mobile Menu Toggle */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            className="bg-white shadow-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full bg-white border-r border-slate-200 transition-all duration-300
          ${sidebarWidth}
          ${isMobile && !mobileMenuOpen ? "opacity-0 -translate-x-full" : "opacity-100"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header with toggle button */}
          <div className={`${collapsed ? 'p-3 justify-center' : 'p-4 justify-between'} border-b border-slate-200 flex items-center`}>
            {!collapsed ? (
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  Gestão de Frotas
                </h1>
                <p className="text-xs text-slate-500">Sistema de gerenciamento</p>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>
            )}
            
            {/* Toggle button - only shown on desktop */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className={`${collapsed ? 'mt-3' : 'ml-auto'} text-slate-400 hover:text-primary`}
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              >
                {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </Button>
            )}
          </div>

          {/* Navigation items */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                
                return (
                  <li key={item.path}>
                    <Link href={item.path}>
                      <div
                        className={`
                          flex items-center ${collapsed ? 'justify-center' : 'justify-start'} 
                          gap-3 px-3 py-2 rounded-md transition-all duration-200 cursor-pointer
                          ${isActive
                            ? "bg-primary/10 text-primary"
                            : "text-slate-600 hover:bg-slate-100"}
                          ${collapsed && 'rounded-full mx-auto w-10 h-10'}
                        `}
                        onClick={() => isMobile && setMobileMenuOpen(false)}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`${collapsed ? 'h-5 w-5 mx-auto' : 'h-5 w-5'}`} />
                        {!collapsed && <span className="font-medium">{item.label}</span>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            {!collapsed && (
              <div className="text-xs text-slate-500 text-center">
                &copy; {new Date().getFullYear()} Sistema de Gestão
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Offset */}
      <div className={contentMargin}></div>
    </>
  );
}
