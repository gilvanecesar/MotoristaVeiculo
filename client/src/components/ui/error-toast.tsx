import { useToast } from "@/hooks/use-toast";
import { parseErrorMessage, isAuthError, isSubscriptionError } from "@/lib/utils/error-handler";
import { AlertCircle, XCircle, Mail, CreditCard, User, Shield } from "lucide-react";

interface ErrorToastOptions {
  title?: string;
  error: any;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Hook personalizado para mostrar erros com ícones e ações específicas
export function useErrorToast() {
  const { toast } = useToast();

  const showError = ({ title, error, action }: ErrorToastOptions) => {
    const errorMessage = parseErrorMessage(error);
    
    // Determina o ícone baseado no tipo de erro
    let icon = AlertCircle;
    let variant: "default" | "destructive" = "destructive";
    
    if (isAuthError(error)) {
      icon = User;
    } else if (isSubscriptionError(error)) {
      icon = CreditCard;
    } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
      icon = Mail;
    } else if (errorMessage.includes('permissão') || errorMessage.includes('acesso')) {
      icon = Shield;
    }

    // Título padrão baseado no tipo de erro
    const defaultTitle = 
      isAuthError(error) ? "Erro de Autenticação" :
      isSubscriptionError(error) ? "Problema com Assinatura" :
      "Erro na Operação";

    toast({
      title: title || defaultTitle,
      description: errorMessage,
      variant,
    });
  };

  return { showError };
}

// Componente para mostrar diferentes tipos de erro com sugestões de ação
export function ErrorDisplay({ error, className = "" }: { error: any; className?: string }) {
  const errorMessage = parseErrorMessage(error);
  
  const getErrorIcon = () => {
    if (isAuthError(error)) return User;
    if (isSubscriptionError(error)) return CreditCard;
    if (errorMessage.includes('email')) return Mail;
    if (errorMessage.includes('permissão')) return Shield;
    return XCircle;
  };

  const getErrorColor = () => {
    if (isAuthError(error)) return "text-blue-600";
    if (isSubscriptionError(error)) return "text-orange-600";
    return "text-red-600";
  };

  const getSuggestion = () => {
    if (errorMessage.includes('Email ou senha incorretos')) {
      return "Verifique se digitou corretamente ou clique em 'Esqueci minha senha'.";
    }
    if (errorMessage.includes('Usuário não encontrado')) {
      return "Parece que você ainda não tem conta. Clique em 'Cadastro' para criar uma.";
    }
    if (errorMessage.includes('email já está cadastrado')) {
      return "Tente fazer login com este email ou use outro email para cadastro.";
    }
    if (errorMessage.includes('CNPJ já está cadastrado')) {
      return "Este CNPJ já possui uma conta. Tente fazer login ou entre em contato com o suporte.";
    }
    if (errorMessage.includes('assinatura')) {
      return "Clique em 'Assinar' para ativar ou renovar sua assinatura.";
    }
    return null;
  };

  const Icon = getErrorIcon();
  const suggestion = getSuggestion();

  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${getErrorColor()} mt-0.5 flex-shrink-0`} />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {isAuthError(error) ? "Problema no Login" : 
             isSubscriptionError(error) ? "Problema com Assinatura" : 
             "Erro"}
          </h3>
          <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
          {suggestion && (
            <p className="mt-2 text-xs text-red-600 bg-red-100 rounded p-2">
              💡 <strong>Dica:</strong> {suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}