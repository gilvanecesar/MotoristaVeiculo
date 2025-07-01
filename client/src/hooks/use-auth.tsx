import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, USER_TYPES } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
      console.log("LOGIN SUCCESS - User data:", user);
      console.log("LOGIN SUCCESS - subscriptionActive:", user.subscriptionActive);
      console.log("LOGIN SUCCESS - profileType:", user.profileType);
      console.log("LOGIN SUCCESS - clientId:", user.clientId);
      
      // Força atualização do cache com os dados do usuário
      queryClient.setQueryData(["/api/user"], user);
      
      // Redireciona após login baseado no status do usuário
      setTimeout(() => {
        // Se motorista, vai para /freights
        if (user.profileType === 'motorista' || user.profileType === 'driver') {
          console.log("REDIRECIONANDO motorista para /freights");
          window.location.href = "/freights";
          return;
        }
        
        // Se usuário com assinatura ativa, vai para /home
        if (user.subscriptionActive) {
          console.log("REDIRECIONANDO para /home - usuário com assinatura ativa");
          window.location.href = "/home";
          return;
        }
        
        // Se usuário sem assinatura, vai para checkout
        console.log("REDIRECIONANDO para checkout - usuário sem assinatura ativa");
        window.location.href = "/checkout?plan=monthly";
      }, 200);
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
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
      toast({
        title: "Falha no cadastro",
        description: error.message || "Não foi possível criar sua conta. Tente novamente.",
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