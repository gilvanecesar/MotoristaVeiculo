import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

type AuthContextType = {
  currentClient: Client | null;
  isLoading: boolean;
  login: (clientId: number) => Promise<boolean>;
  logout: () => void;
  isClientAuthorized: (clientId: number | null) => boolean;
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
      console.error('Erro ao buscar cliente:', error);
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
      console.error('Erro ao fazer login:', error);
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
    // Verifica se o usuário é admin usando o contexto de autenticação
    if (user && user.profileType && user.profileType.toLowerCase() === 'admin') {
      console.log("Usuário é admin, autorizando acesso");
      return true;
    }
    
    // Para usuários comuns, verifica se é o dono do frete
    if (!currentClient) {
      console.log("Não há cliente atual logado, negando acesso");
      return false;
    }
    if (clientId === null) {
      console.log("Frete sem cliente associado, permitindo acesso");
      return true; // Fretes sem cliente associado podem ser editados por qualquer cliente logado
    }
    
    const isAuthorized = currentClient.id === clientId;
    console.log(`Verificando autorização: Cliente atual ID ${currentClient.id}, ClienteID do frete ${clientId}, Autorizado: ${isAuthorized}`);
    return isAuthorized;
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