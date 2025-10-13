import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, USER_TYPES } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { parseErrorMessage, isAuthError, isSubscriptionError } from "@/lib/utils/error-handler";
import { useErrorToast } from "@/components/ui/error-toast";

// ===== TYPES =====
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  name: string;
  profileType: string;
  subscriptionType?: string;
};

// ===== CONTEXT =====
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Fetch current user data
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Lógica de redirecionamento após login bem-sucedido
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo à plataforma Quero Fretes",
      });
      
      const isDriver = user.profileType === 'motorista' || user.profileType === 'driver';
      const isAdmin = user.profileType === 'admin' || user.profileType === 'administrador';
      const isTransportador = user.profileType === 'transportador';
      const isAgenciador = user.profileType === 'agenciador';
      
      if (isAdmin) {
        // Se for admin, redireciona para a página admin
        setTimeout(() => setLocation("/admin"), 1000);
      } else if (isDriver) {
        // Se for motorista, redireciona para a página de fretes
        setTimeout(() => setLocation("/freights"), 1000);
      } else if (user.subscriptionActive) {
        // Se já tem assinatura ativa, verificar perfil específico
        if ((isTransportador || isAgenciador) && !user.clientId) {
          // Transportador ou agenciador sem cliente cadastrado vai para criar cliente
          setTimeout(() => setLocation("/clients/new"), 1000);
        } else {
          // Outros perfis ou já tem cliente, vai para Home
          setTimeout(() => setLocation("/home"), 1000);
        }
      } else {
        // Se não tem assinatura ativa e não é motorista, redireciona para checkout
        setTimeout(() => setLocation("/checkout"), 1000);
      }
    },
    onError: (error: Error) => {
      console.log("LOGIN ERROR:", error.message);
      
      const errorMessage = parseErrorMessage(error);
      
      toast({
        title: "Falha no login",
        description: errorMessage,
        variant: "destructive",
      });

      // Se o erro for de credenciais inválidas, pode redirecionar para cadastro
      if (isAuthError(error) && errorMessage.includes('Usuário não encontrado')) {
        // Sugere redirecionamento para cadastro após um tempo
        setTimeout(() => {
          toast({
            title: "Primeira vez aqui?",
            description: "Clique em 'Cadastro' para criar sua conta.",
          });
        }, 3000);
      }
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      const errorMessage = parseErrorMessage(error);
      
      toast({
        title: "Falha no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao sair",
        description: error.message || "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}