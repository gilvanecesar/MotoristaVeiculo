import { useIsMobile } from "@/hooks/use-mobile";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const isMobile = useIsMobile();
  
  return (
    <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
      <div className={`${isMobile ? 'container mx-auto' : ''} px-6`}>
        <div className="text-center text-sm text-slate-500">
          &copy; {currentYear} Sistema de Gestão de Motoristas e Veículos. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
