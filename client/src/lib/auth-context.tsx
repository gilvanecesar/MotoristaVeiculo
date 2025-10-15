import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

// Interface para usuário logado
type User = {
  id: number;
  name: string;
  email: string;
  profileType?: string;
  clientId?: number | null;
};

type AuthContextType = {
  currentClient: Client | null;
  isLoading: boolean;
  login: (clientId: number) => Promise<boolean>;
  logout: () => void;
  isClientAuthorized: (clientId: number | null) => boolean;
};

export const useAuth = () => {
  // Hook simplificado para evitar dependência circular
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/user");
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch (error) {
        return null;
      }
    }
  });

  return { user: user || null };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  // Verifica se já existe um cliente logado no localStorage ao iniciar
  useEffect(() => {
    const savedClientId = localStorage.getItem('currentClientId');
    
    if (savedClientId) {
      fetchClientById(parseInt(savedClientId))
        .then((client) => {
          if (client) {
            setCurrentClient(client);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Função para buscar um cliente por ID
  const fetchClientById = async (clientId: number): Promise<Client | null> => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) {
        throw new Error('Cliente não encontrado');
      }
      return await response.json();
    } catch (error) {
      return null;
    }
  };

  // Função para fazer login como um cliente
  const login = async (clientId: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      const client = await fetchClientById(clientId);
      
      if (client) {
        setCurrentClient(client);
        localStorage.setItem('currentClientId', clientId.toString());
        return true;
      }
      return false;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fazer logout
  const logout = () => {
    setCurrentClient(null);
    localStorage.removeItem('currentClientId');
  };

  // Verifica se o cliente atual está autorizado a editar/excluir um frete
  const isClientAuthorized = (clientId: number | null): boolean => {
    // Verifica se o usuário é administrador usando o contexto de autenticação
    if (user && user.profileType && user.profileType.toLowerCase() === 'administrador') {
      return true;
    }
    
    // Permite acesso a motoristas para visualização (mas não para edição/exclusão)
    // Os botões de edição/exclusão são condicionalmente renderizados na UI
    if (user && user.profileType && user.profileType.toLowerCase() === 'motorista') {
      // Motoristas só podem ver, não editar/excluir, então retornamos false
      // mas isso não impede a visualização na lista
      return false;
    }
    
    // Verifica se o usuário atual tem clientId (está associado a um cliente)
    if (user && user.clientId) {
      // Se o frete não tem cliente associado ou clientId é zero (padrão), qualquer usuário autenticado pode editar
      if (clientId === null || clientId === 0) {
        return true;
      }
      
      // Verifica se o clientId do usuário é o mesmo do frete
      const isAuthorized = user.clientId === clientId;
      return isAuthorized;
    }
    
    // Para compatibilidade, também verifica o currentClient do localStorage (caso ainda esteja em uso)
    if (currentClient) {
      if (clientId === null || clientId === 0) {
        return true;
      }
      
      const isAuthorized = currentClient.id === clientId;
      return isAuthorized;
    }
    
    // Se não houver cliente associado ao frete (clientId é null ou 0), qualquer usuário autenticado pode editar
    if (clientId === null || clientId === 0) {
      return true;
    }
    
    // Retorna false para impedir edição/exclusão, mas isso não impede a visualização na lista
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentClient,
        isLoading,
        login,
        logout,
        isClientAuthorized
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação
export const useClientAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};