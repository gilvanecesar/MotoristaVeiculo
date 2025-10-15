import Navbar from "./navbar";
import { SubscriptionStatusBanner } from "@/components/ui/subscription-status-banner";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Navbar no topo */}
      <Navbar />

      {/* Banners de status */}
      <div className="flex-shrink-0">
        <SubscriptionStatusBanner />
      </div>

      {/* Área de conteúdo */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}