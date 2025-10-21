import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  X,
  Calendar,
  CreditCard
} from "lucide-react";
import { cva } from "class-variance-authority";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

const bannerVariants = cva(
  "fixed top-4 right-4 max-w-sm w-full p-4 rounded-lg shadow-lg z-50 transition-all duration-500 transform flex items-center gap-3",
  {
    variants: {
      status: {
        active: "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
        expired: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
        inactive: "bg-gradient-to-r from-rose-500 to-red-500 text-white",
      },
    },
    defaultVariants: {
      status: "inactive",
    },
  }
);

export function SubscriptionStatusBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Se o usuário estiver logado, mostrar o banner depois de 2 segundos
    if (user && !dismissed) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 2000);
      
      // Auto-ocultar após 10 segundos
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 12000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [user, dismissed]);

  if (!user || !visible) return null;

  // Determinar status da assinatura
  const isAdmin = user.profileType === "admin";
  const isFreeDriver = user.profileType === "motorista" || user.profileType === "driver" || user.subscriptionType === "driver_free";
  const isSubscriptionActive = user.subscriptionActive === true;
  const isExpired = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date();

  let status: "active" | "expired" | "inactive" = "inactive";
  let icon = <XCircle className="h-6 w-6" />;
  let title = "";
  let description = "";

  if (isAdmin) {
    status = "active";
    icon = <CheckCircle className="h-6 w-6" />;
    title = "Acesso de Administrador";
    description = "Você tem acesso completo ao sistema como administrador.";
  } else if (isFreeDriver) {
    status = "active";
    icon = <CheckCircle className="h-6 w-6" />;
    title = "Acesso de Motorista";
    description = "Você tem acesso gratuito às funcionalidades de motorista.";
  } else if (isSubscriptionActive && !isExpired) {
    status = "active";
    icon = <CheckCircle className="h-6 w-6" />;
    
    // Calcular data de expiração da assinatura ativa
    let validUntil = "indefinidamente";
    
    // Verificar se existe uma data de expiração válida
    if (user.subscriptionExpiresAt && isValid(new Date(user.subscriptionExpiresAt))) {
      const expiresAt = new Date(user.subscriptionExpiresAt);
      validUntil = formatDistanceToNow(expiresAt, { locale: ptBR, addSuffix: true });
    }
    
    title = "Assinatura Ativa";
    description = `Sua assinatura é válida ${validUntil}.`;
  } else if (isExpired || !isSubscriptionActive) {
    status = "expired";
    icon = <AlertCircle className="h-6 w-6" />;
    title = "Assinatura Expirada";
    description = "Sua assinatura expirou. Renove para continuar utilizando o sistema.";
    
    if (user.paymentRequired) {
      status = "inactive";
      icon = <CreditCard className="h-6 w-6" />;
      title = "Pagamento Necessário";
      description = "Assine agora para ter acesso completo ao sistema.";
    }
  }

  return (
    <div 
      className={bannerVariants({ status })}
      style={{ 
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-20px)'
      }}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1">
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
      <button 
        onClick={() => {
          setVisible(false);
          setDismissed(true);
        }}
        className="shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}