import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LayoutDashboard, Users, Car, BarChart3, Menu, X } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      {/* Mobile Menu Toggle */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            className="bg-white shadow-md"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full bg-white border-r border-slate-200 transition-all
          ${isMobile 
            ? isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 -translate-x-full' 
            : 'w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-800">
              Gestão de Frotas
            </h1>
            <p className="text-xs text-slate-500">Sistema de gerenciamento</p>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                
                return (
                  <li key={item.path}>
                    <Link href={item.path}>
                      <a
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                          ${isActive
                            ? "bg-primary/10 text-primary"
                            : "text-slate-600 hover:bg-slate-100"}
                        `}
                        onClick={() => isMobile && setIsOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 text-center">
              &copy; {new Date().getFullYear()} Sistema de Gestão
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Offset */}
      <div className={`${isMobile ? 'ml-0' : 'ml-64'}`}></div>
    </>
  );
}
