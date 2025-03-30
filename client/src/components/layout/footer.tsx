import { useIsMobile } from "@/hooks/use-mobile";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const isMobile = useIsMobile();
  
  return (
    <footer className={`bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-4 mt-auto ${className}`}>
      <div className={`${isMobile ? 'container mx-auto' : ''} px-6`}>
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          &copy; {currentYear} QUERO FRETES - Sistema de Gestão de Fretes. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
