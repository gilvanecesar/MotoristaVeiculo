import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "./sidebar";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentBanner } from "@/components/payment-banner";
import { SubscriptionStatusBanner } from "@/components/ui/subscription-status-banner";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Overlay para mobile */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "relative z-50",
        isMobile && !mobileMenuOpen && "hidden"
      )}>
        <Sidebar 
          collapsed={!isMobile && sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <h1 className="font-semibold">QUERO FRETES</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        )}

        {/* Banners de status */}
        <div className="flex-shrink-0">
          <SubscriptionStatusBanner />
          <PaymentBanner />
        </div>

        {/* Área de conteúdo */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}