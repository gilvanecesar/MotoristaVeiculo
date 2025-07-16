import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck, Building2, Users } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FaWhatsapp } from "react-icons/fa";

// Função utilitária para processar erros da API
const processApiError = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.json();
    return errorData.message || "Erro no cadastro";
  } catch {
    return "Erro no cadastro";
  }
};

const PROFILE_TYPES = {
  MOTORISTA: "motorista",
  EMBARCADOR: "embarcador",
  TRANSPORTADOR: "transportador",
  AGENCIADOR: "agenciador"
} as const;

// Schemas de validação rigorosa para cada perfil - TODOS OS CAMPOS OBRIGATÓRIOS
const motoristaSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z.string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: z.string()
    .min(1, "CPF é obrigatório")
    .min(11, "CPF deve ter 11 dígitos")
    .max(14, "CPF inválido"),
  whatsapp: z.string()
    .min(1, "WhatsApp é obrigatório")
    .min(10, "WhatsApp deve ter pelo menos 10 dígitos")
    .max(15, "WhatsApp inválido"),
  anttVehicle: z.string()
    .min(1, "ANTT do veículo é obrigatório")
    .max(20, "ANTT inválido"),
  vehiclePlate: z.string()
    .min(1, "Placa do veículo é obrigatória")
    .min(7, "Placa deve ter pelo menos 7 caracteres")
    .max(8, "Placa inválida")
});

const embarcadorSchema = z.object({
  name: z.string()
    .min(1, "Nome da empresa é obrigatório")
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  contactName: z.string()
    .min(1, "Nome do contato é obrigatório")
    .min(3, "Nome do contato deve ter pelo menos 3 caracteres")
    .max(100, "Nome do contato muito longo"),
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z.string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
  cnpj: z.string()
    .min(1, "CNPJ é obrigatório")
    .min(14, "CNPJ deve ter 14 dígitos")
    .max(18, "CNPJ inválido"),
  whatsapp: z.string()
    .min(1, "WhatsApp é obrigatório")
    .min(10, "WhatsApp deve ter pelo menos 10 dígitos")
    .max(15, "WhatsApp inválido")
});

const transportadorSchema = z.object({
  name: z.string()
    .min(1, "Nome da empresa é obrigatório")
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  contactName: z.string()
    .min(1, "Nome do contato é obrigatório")
    .min(3, "Nome do contato deve ter pelo menos 3 caracteres")
    .max(100, "Nome do contato muito longo"),
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z.string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
  cnpj: z.string()
    .min(1, "CNPJ é obrigatório")
    .min(14, "CNPJ deve ter 14 dígitos")
    .max(18, "CNPJ inválido"),
  whatsapp: z.string()
    .min(1, "WhatsApp é obrigatório")
    .min(10, "WhatsApp deve ter pelo menos 10 dígitos")
    .max(15, "WhatsApp inválido")
});

const agenciadorSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z.string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
  documento: z.string()
    .min(1, "CPF ou CNPJ é obrigatório")
    .min(11, "Documento deve ter pelo menos 11 dígitos")
    .max(18, "Documento inválido"),
  whatsapp: z.string()
    .min(1, "WhatsApp é obrigatório")
    .min(10, "WhatsApp deve ter pelo menos 10 dígitos")
    .max(15, "WhatsApp inválido")
});

export default function ProfileSelection() {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const motoristaForm = useForm({
    resolver: zodResolver(motoristaSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      cpf: "",
      whatsapp: "",
      anttVehicle: "",
      vehiclePlate: ""
    }
  });

  const embarcadorForm = useForm({
    resolver: zodResolver(embarcadorSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      password: "",
      cnpj: "",
      whatsapp: ""
    }
  });

  const transportadorForm = useForm({
    resolver: zodResolver(transportadorSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      password: "",
      cnpj: "",
      whatsapp: ""
    }
  });

  const agenciadorForm = useForm({
    resolver: zodResolver(agenciadorSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      documento: "",
      whatsapp: ""
    }
  });

  // Função para buscar dados do veículo pela placa
  const fetchVehicleData = async (plate: string) => {
    try {
      // Aqui integraria com API gratuita de veículos
      // Por enquanto simulando busca
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        brand: "Toyota",
        model: "Hilux",
        year: "2020"
      };
    } catch (error) {
      console.error("Erro ao buscar dados do veículo:", error);
      return null;
    }
  };

  // Função para buscar dados da empresa pelo CNPJ
  const fetchCompanyData = async (cnpj: string) => {
    try {
      // Integração com ReceitaWS via backend para evitar CORS
      const response = await fetch(`/api/validate/cnpj/${cnpj.replace(/\D/g, '')}`);
      if (response.ok) {
        const data = await response.json();
        return {
          name: data.name,
          fantasia: data.fantasia,
          situacao: data.situacao
        };
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar dados da empresa:", error);
      return null;
    }
  };

  // Função para verificar campos obrigatórios vazios
  const validateRequiredFields = (data: any, fieldNames: string[]) => {
    const emptyFields = fieldNames.filter(field => !data[field] || data[field].trim() === "");
    if (emptyFields.length > 0) {
      const fieldLabels = {
        name: "Nome",
        contactName: "Nome do Contato",
        email: "Email", 
        password: "Senha",
        cpf: "CPF",
        cnpj: "CNPJ",
        whatsapp: "WhatsApp",
        anttVehicle: "ANTT do Veículo",
        vehiclePlate: "Placa do Veículo",
        documento: "CPF/CNPJ"
      };
      
      const missingLabels = emptyFields.map(field => fieldLabels[field as keyof typeof fieldLabels] || field);
      
      toast({
        title: "❌ Campos obrigatórios não preenchidos",
        description: `Por favor, preencha os seguintes campos: ${missingLabels.join(", ")}`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  // Componente para labels com asterisco obrigatório
  const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <FormLabel className="flex items-center gap-1">
      {children}
      <span className="text-red-500 font-bold">*</span>
    </FormLabel>
  );

  const onMotoristaSubmit = async (data: z.infer<typeof motoristaSchema>) => {
    // Validação extra para campos obrigatórios
    if (!validateRequiredFields(data, ["name", "email", "password", "cpf", "whatsapp", "anttVehicle", "vehiclePlate"])) {
      return;
    }

    setIsLoading(true);
    try {
      // Buscar dados do veículo
      toast({
        title: "Buscando dados do veículo...",
        description: "Aguarde enquanto buscamos as informações."
      });

      const vehicleData = await fetchVehicleData(data.vehiclePlate);
      
      const userData = {
        ...data,
        profileType: PROFILE_TYPES.MOTORISTA,
        name: data.name, // Usar o nome real digitado pelo usuário
        vehicleData
      };

      const response = await apiRequest("POST", "/api/auth/register-profile", userData);
      
      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Redirecionando para os fretes disponíveis..."
        });
        
        // Verificar se a autenticação foi processada e redirecionar
        let attempts = 0;
        const maxAttempts = 10; // Máximo 5 segundos de tentativas
        
        const checkAuthAndRedirect = async () => {
          try {
            attempts++;
            
            // Verificar se o usuário está autenticado
            const userResponse = await fetch("/api/user", {
              credentials: "include"
            });
            
            if (userResponse.ok) {
              // Usuário autenticado, redirecionar
              setLocation("/freights");
            } else if (attempts < maxAttempts) {
              // Tentar novamente após um breve delay
              setTimeout(checkAuthAndRedirect, 500);
            } else {
              // Máximo de tentativas atingido, redirecionar mesmo assim
              console.warn("Máximo de tentativas de autenticação atingido, redirecionando...");
              setLocation("/freights");
            }
          } catch (error) {
            console.error("Erro ao verificar autenticação:", error);
            if (attempts < maxAttempts) {
              setTimeout(checkAuthAndRedirect, 500);
            } else {
              // Fallback: redirecionar mesmo com erro
              setLocation("/freights");
            }
          }
        };
        
        checkAuthAndRedirect();
      } else {
        const errorMessage = await processApiError(response);
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: error instanceof Error ? error.message : "Tente novamente ou entre em contato conosco.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onEmbarcadorSubmit = async (data: z.infer<typeof embarcadorSchema>) => {
    // Validação extra para campos obrigatórios
    if (!validateRequiredFields(data, ["name", "contactName", "email", "password", "cnpj", "whatsapp"])) {
      return;
    }

    setIsLoading(true);
    try {
      // Buscar dados da empresa
      toast({
        title: "Buscando dados da empresa...",
        description: "Consultando informações no CNPJ..."
      });

      const companyData = await fetchCompanyData(data.cnpj);
      
      if (!companyData) {
        throw new Error("CNPJ não encontrado ou inválido");
      }

      const userData = {
        ...data,
        profileType: PROFILE_TYPES.EMBARCADOR,
        name: companyData.name,
        contactName: data.contactName,
        companyData
      };

      const response = await apiRequest("POST", "/api/auth/register-profile", userData);
      
      if (response.ok) {
        const result = await response.json();
        
        // Verificar se precisa de assinatura
        if (result.needsSubscription) {
          toast({
            title: "Cadastro realizado!",
            description: "Redirecionando para o checkout..."
          });
          setLocation("/checkout");
        } else {
          toast({
            title: "Bem-vindo!",
            description: "Redirecionando para o painel principal..."
          });
          setLocation("/home");
        }
      } else {
        const errorMessage = await processApiError(response);
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onTransportadorSubmit = async (data: z.infer<typeof transportadorSchema>) => {
    // Validação extra para campos obrigatórios
    if (!validateRequiredFields(data, ["name", "contactName", "email", "password", "cnpj", "whatsapp"])) {
      return;
    }

    setIsLoading(true);
    try {
      // Buscar dados da empresa
      toast({
        title: "Buscando dados da empresa...",
        description: "Consultando informações no CNPJ..."
      });

      const companyData = await fetchCompanyData(data.cnpj);
      
      if (!companyData) {
        throw new Error("CNPJ não encontrado ou inválido");
      }

      const userData = {
        ...data,
        profileType: PROFILE_TYPES.TRANSPORTADOR,
        name: companyData.name,
        contactName: data.contactName,
        companyData
      };

      const response = await apiRequest("POST", "/api/auth/register-profile", userData);
      
      if (response.ok) {
        const result = await response.json();
        
        // Verificar se precisa de assinatura
        if (result.needsSubscription) {
          toast({
            title: "Cadastro realizado!",
            description: "Redirecionando para o checkout..."
          });
          setLocation("/checkout");
        } else {
          toast({
            title: "Bem-vindo!",
            description: "Redirecionando para o painel principal..."
          });
          setLocation("/home");
        }
      } else {
        const errorMessage = await processApiError(response);
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onAgenciadorSubmit = async (data: z.infer<typeof agenciadorSchema>) => {
    // Validação extra para campos obrigatórios
    if (!validateRequiredFields(data, ["name", "email", "password", "documento", "whatsapp"])) {
      return;
    }

    setIsLoading(true);
    try {
      let companyData = null;
      
      // Se for CNPJ, buscar dados da empresa
      if (data.documento.length >= 14) {
        toast({
          title: "Buscando dados da empresa...",
          description: "Consultando informações no CNPJ..."
        });
        companyData = await fetchCompanyData(data.documento);
      }

      const userData = {
        ...data,
        profileType: PROFILE_TYPES.AGENCIADOR,
        name: companyData?.name || data.name,
        companyData
      };

      const response = await apiRequest("POST", "/api/auth/register-profile", userData);
      
      if (response.ok) {
        const result = await response.json();
        
        // Verificar se precisa de assinatura
        if (result.needsSubscription) {
          toast({
            title: "Cadastro realizado!",
            description: "Redirecionando para o checkout..."
          });
          setLocation("/checkout");
        } else {
          toast({
            title: "Bem-vindo!",
            description: "Redirecionando para o painel principal..."
          });
          setLocation("/home");
        }
      } else {
        const errorMessage = await processApiError(response);
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl w-full">
        {!selectedProfile ? (
          <div className="text-center space-y-8">
            {/* Link para usuários existentes - DESTAQUE */}
            <div className="mb-6 bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
              <p className="text-gray-700 mb-4 text-lg font-medium">Já tem uma conta?</p>
              <Button 
                size="lg"
                onClick={() => setLocation("/login")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                🔑 FAZER LOGIN
              </Button>
            </div>
            
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Bem-vindo ao QUERO FRETES
              </h1>
              <p className="text-xl text-gray-600">
                Escolha seu perfil para começar
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Motorista */}
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-blue-500 h-full flex flex-col"
                onClick={() => setSelectedProfile(PROFILE_TYPES.MOTORISTA)}
              >
                <CardHeader className="text-center pb-4 flex-1">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Truck className="w-10 h-10 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-blue-600 mb-2">SOU MOTORISTA</CardTitle>
                  <CardDescription className="text-gray-600 text-sm">
                    Encontre fretes disponíveis na sua região
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>

              {/* Embarcador */}
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-green-500 h-full flex flex-col"
                onClick={() => setSelectedProfile(PROFILE_TYPES.EMBARCADOR)}
              >
                <CardHeader className="text-center pb-4 flex-1">
                  <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="w-10 h-10 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-green-600 mb-2">EMBARCADOR</CardTitle>
                  <CardDescription className="text-gray-600 text-sm">
                    Publique suas cargas e encontre transportadores
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>

              {/* Transportador */}
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-purple-500 h-full flex flex-col"
                onClick={() => setSelectedProfile(PROFILE_TYPES.TRANSPORTADOR)}
              >
                <CardHeader className="text-center pb-4 flex-1">
                  <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="w-10 h-10 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl text-purple-600 mb-2">TRANSPORTADOR</CardTitle>
                  <CardDescription className="text-gray-600 text-sm">
                    Ofereça seus serviços de transporte
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>

              {/* Agenciador */}
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-orange-500 h-full flex flex-col"
                onClick={() => setSelectedProfile(PROFILE_TYPES.AGENCIADOR)}
              >
                <CardHeader className="text-center pb-4 flex-1">
                  <div className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl text-orange-600 mb-2">SOU AGENCIADOR</CardTitle>
                  <CardDescription className="text-gray-600 text-sm">
                    Conecte motoristas e embarcadores
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedProfile(null)}
                  className="w-fit mb-4"
                >
                  ← Voltar
                </Button>
                <CardTitle className="text-center">
                  {selectedProfile === PROFILE_TYPES.MOTORISTA && "Cadastro de Motorista"}
                  {selectedProfile === PROFILE_TYPES.EMBARCADOR && "Cadastro de Embarcador"}
                  {selectedProfile === PROFILE_TYPES.TRANSPORTADOR && "Cadastro de Transportador"}
                  {selectedProfile === PROFILE_TYPES.AGENCIADOR && "Cadastro de Agenciador"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProfile === PROFILE_TYPES.MOTORISTA && (
                  <Form {...motoristaForm}>
                    <form onSubmit={motoristaForm.handleSubmit(onMotoristaSubmit)} className="space-y-4">
                      <FormField
                        control={motoristaForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>Nome Completo</RequiredLabel>
                            <FormControl>
                              <Input placeholder="Digite seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={motoristaForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>E-mail</RequiredLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={motoristaForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>Senha</RequiredLabel>
                            <FormControl>
                              <Input type="password" placeholder="Digite sua senha (min. 6 caracteres)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={motoristaForm.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>CPF</RequiredLabel>
                            <FormControl>
                              <Input placeholder="000.000.000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={motoristaForm.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>WhatsApp</RequiredLabel>
                            <FormControl>
                              <Input placeholder="(11) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={motoristaForm.control}
                        name="anttVehicle"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>ANTT do Veículo</RequiredLabel>
                            <FormControl>
                              <Input placeholder="Digite o ANTT" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={motoristaForm.control}
                        name="vehiclePlate"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>Placa do Veículo</RequiredLabel>
                            <FormControl>
                              <Input placeholder="ABC-1234" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Processando..." : "Finalizar Cadastro"}
                      </Button>
                    </form>
                  </Form>
                )}

                {selectedProfile === PROFILE_TYPES.EMBARCADOR && (
                  <Form {...embarcadorForm}>
                    <form onSubmit={embarcadorForm.handleSubmit(onEmbarcadorSubmit)} className="space-y-4">
                      <FormField
                        control={embarcadorForm.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>CNPJ</RequiredLabel>
                            <FormControl>
                              <Input placeholder="00.000.000/0000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={embarcadorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>Nome da Empresa</RequiredLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome da empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={embarcadorForm.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>Nome do Contato</RequiredLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome do responsável/contato" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={embarcadorForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>E-mail para contato</RequiredLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={embarcadorForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>Senha</RequiredLabel>
                            <FormControl>
                              <Input type="password" placeholder="Digite sua senha (min. 6 caracteres)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={embarcadorForm.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>WhatsApp</RequiredLabel>
                            <FormControl>
                              <Input type="tel" placeholder="(11) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Processando..." : "Finalizar Cadastro"}
                      </Button>
                    </form>
                  </Form>
                )}

                {selectedProfile === PROFILE_TYPES.TRANSPORTADOR && (
                  <Form {...transportadorForm}>
                    <form onSubmit={transportadorForm.handleSubmit(onTransportadorSubmit)} className="space-y-4">
                      <FormField
                        control={transportadorForm.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>CNPJ</RequiredLabel>
                            <FormControl>
                              <Input placeholder="00.000.000/0000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={transportadorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>Nome da Empresa</RequiredLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome da empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={transportadorForm.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>Nome do Contato</RequiredLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome do responsável/contato" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={transportadorForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>E-mail para contato</RequiredLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={transportadorForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>Senha</RequiredLabel>
                            <FormControl>
                              <Input type="password" placeholder="Digite sua senha (min. 6 caracteres)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={transportadorForm.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>WhatsApp</RequiredLabel>
                            <FormControl>
                              <Input type="tel" placeholder="(11) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Processando..." : "Finalizar Cadastro"}
                      </Button>
                    </form>
                  </Form>
                )}

                {selectedProfile === PROFILE_TYPES.AGENCIADOR && (
                  <Form {...agenciadorForm}>
                    <form onSubmit={agenciadorForm.handleSubmit(onAgenciadorSubmit)} className="space-y-4">
                      <FormField
                        control={agenciadorForm.control}
                        name="documento"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>CPF ou CNPJ</RequiredLabel>
                            <FormControl>
                              <Input placeholder="000.000.000-00 ou 00.000.000/0000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={agenciadorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>Nome Completo</RequiredLabel>
                            <FormControl>
                              <Input placeholder="Digite seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={agenciadorForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>E-mail</RequiredLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={agenciadorForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>Senha</RequiredLabel>
                            <FormControl>
                              <Input type="password" placeholder="Digite sua senha (min. 6 caracteres)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={agenciadorForm.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>WhatsApp</RequiredLabel>
                            <FormControl>
                              <Input placeholder="(11) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Processando..." : "Finalizar Cadastro"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Botão Falar com Suporte - SEMPRE VISÍVEL */}
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            className="w-full max-w-sm mx-auto bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
            onClick={() => window.open("https://wa.me/5531971559484", "_blank")}
          >
            <FaWhatsapp className="mr-2 h-4 w-4" />
            Falar com Suporte
          </Button>
        </div>
      </div>
    </div>
  );
}