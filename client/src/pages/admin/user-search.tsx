import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, User, Mail, Phone, Calendar, CreditCard, Truck, Building2, UserCheck, UserX } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";

// Funções de formatação
const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return value;
};

const formatCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 14) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
};

const formatDocument = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  
  // Se tem apenas números
  if (/^\d+$/.test(value.replace(/[-./]/g, ''))) {
    if (numbers.length <= 11) {
      return formatCPF(value);
    } else if (numbers.length <= 14) {
      return formatCNPJ(value);
    }
  }
  
  return value;
};

interface UserInfo {
  id: number;
  email: string;
  name: string;
  profile_type: string;
  phone?: string;
  whatsapp?: string;
  cpf?: string;
  cnpj?: string;
  antt_vehicle?: string;
  vehicle_plate?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  subscription_active: boolean;
  subscription_type?: string;
  subscription_expires_at?: string;
  payment_required: boolean;
  driver_id?: number;
  client_id?: number;
}

export default function UserSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  // Mutação para ativar/desativar assinatura
  const toggleSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, activate }: { userId: number, activate: boolean }) => {
      const endpoint = activate ? 'activate-subscription' : 'deactivate-subscription';
      const res = await apiRequest("POST", `/api/admin/users/${userId}/${endpoint}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha ao alterar assinatura");
      }
      return await res.json();
    },
    onSuccess: (data, variables) => {
      // Atualizar o estado local do usuário
      if (userInfo) {
        setUserInfo({
          ...userInfo,
          subscription_active: variables.activate,
          subscription_expires_at: variables.activate ? data.expiresAt : undefined
        });
      }
      
      toast({
        title: variables.activate ? "Assinatura ativada" : "Assinatura desativada",
        description: variables.activate 
          ? "A assinatura do usuário foi ativada com sucesso" 
          : "A assinatura do usuário foi desativada",
        variant: variables.activate ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite um ID, email, CPF ou CNPJ para pesquisar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    setUserInfo(null);

    try {
      const response = await apiRequest("GET", `/api/admin/user-search?q=${encodeURIComponent(searchTerm)}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      } else if (response.status === 404) {
        setNotFound(true);
      } else {
        toast({
          title: "Erro na pesquisa",
          description: "Erro ao buscar informações do usuário",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro na pesquisa:", error);
      toast({
        title: "Erro na pesquisa",
        description: "Erro ao buscar informações do usuário",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProfileIcon = (profileType: string) => {
    switch (profileType) {
      case "motorista":
        return <Truck className="h-4 w-4" />;
      case "embarcador":
      case "transportador":
        return <Building2 className="h-4 w-4" />;
      case "agenciador":
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getProfileColor = (profileType: string) => {
    switch (profileType) {
      case "motorista":
        return "bg-blue-100 text-blue-800";
      case "embarcador":
      case "transportador":
        return "bg-green-100 text-green-800";
      case "agenciador":
        return "bg-orange-100 text-orange-800";
      case "administrador":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Search className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Pesquisar Usuário</h1>
      </div>

      {/* Formulário de Pesquisa */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Usuário</CardTitle>
          <CardDescription>
            Digite o ID, email, CPF ou CNPJ para pesquisar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">ID, Email, CPF ou CNPJ</Label>
              <Input
                id="search"
                placeholder="Ex: 390, usuario@email.com, 12345678900 ou 12.345.678/0001-90"
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  const formatted = formatDocument(value);
                  setSearchTerm(formatted);
                }}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Buscando..." : "Pesquisar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usuário não encontrado */}
      {notFound && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">Usuário não encontrado</h3>
              <p className="text-gray-500">Nenhum usuário encontrado com "{searchTerm}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações do Usuário */}
      {userInfo && (
        <div className="space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">ID</Label>
                  <p className="text-lg font-semibold">{userInfo.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nome</Label>
                  <p className="text-lg">{userInfo.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-lg flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {userInfo.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Perfil</Label>
                  <Badge className={`${getProfileColor(userInfo.profile_type)} flex items-center gap-1 w-fit`}>
                    {getProfileIcon(userInfo.profile_type)}
                    {userInfo.profile_type.toUpperCase()}
                  </Badge>
                </div>
                {userInfo.phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                    <p className="text-lg flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {userInfo.phone}
                    </p>
                  </div>
                )}
                {userInfo.whatsapp && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">WhatsApp</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a
                        href={`https://wa.me/55${userInfo.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg text-green-600 hover:text-green-800 hover:underline transition-colors"
                      >
                        {userInfo.whatsapp}
                      </a>
                    </div>
                  </div>
                )}
                {userInfo.cpf && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">CPF</Label>
                    <p className="text-lg">{userInfo.cpf}</p>
                  </div>
                )}
                {userInfo.cnpj && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">CNPJ</Label>
                    <p className="text-lg">{userInfo.cnpj}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dados do Veículo (se motorista) */}
          {userInfo.profile_type === "motorista" && (userInfo.antt_vehicle || userInfo.vehicle_plate) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Dados do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {userInfo.antt_vehicle && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">ANTT</Label>
                      <p className="text-lg">{userInfo.antt_vehicle}</p>
                    </div>
                  )}
                  {userInfo.vehicle_plate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Placa</Label>
                      <p className="text-lg">{userInfo.vehicle_plate}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Status da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Criado em</Label>
                  <p className="text-lg">{formatDate(userInfo.created_at)}</p>
                </div>
                {userInfo.last_login && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Último login</Label>
                    <p className="text-lg">{formatDate(userInfo.last_login)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="flex gap-2">
                    <Badge variant={userInfo.is_active ? "default" : "secondary"}>
                      {userInfo.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant={userInfo.is_verified ? "default" : "secondary"}>
                      {userInfo.is_verified ? "Verificado" : "Não verificado"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assinatura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Assinatura
                </div>
                <Button
                  onClick={() => toggleSubscriptionMutation.mutate({ 
                    userId: userInfo.id, 
                    activate: !userInfo.subscription_active 
                  })}
                  disabled={toggleSubscriptionMutation.isPending}
                  variant={userInfo.subscription_active ? "destructive" : "default"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {toggleSubscriptionMutation.isPending ? (
                    "Processando..."
                  ) : (
                    <>
                      {userInfo.subscription_active ? (
                        <>
                          <UserX className="h-4 w-4" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Ativar
                        </>
                      )}
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge variant={userInfo.subscription_active ? "default" : "secondary"}>
                    {userInfo.subscription_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                {userInfo.subscription_type && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                    <p className="text-lg capitalize">{userInfo.subscription_type}</p>
                  </div>
                )}
                {userInfo.subscription_expires_at && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Vencimento</Label>
                    <p className="text-lg">{formatDate(userInfo.subscription_expires_at)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Pagamento necessário</Label>
                  <Badge variant={userInfo.payment_required ? "destructive" : "default"}>
                    {userInfo.payment_required ? "Sim" : "Não"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}