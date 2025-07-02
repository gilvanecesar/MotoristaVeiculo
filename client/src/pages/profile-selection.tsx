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
  AGENCIADOR: "agenciador"
} as const;

// Schemas de validação para cada perfil
const motoristaSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(14),
  whatsapp: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos"),
  anttVehicle: z.string().min(1, "ANTT do veículo é obrigatório"),
  vehiclePlate: z.string().min(7, "Placa deve ter pelo menos 7 caracteres").max(8)
});

const embarcadorSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos").max(18)
});

const agenciadorSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  documento: z.string().min(11, "CPF ou CNPJ é obrigatório"),
  whatsapp: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos")
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
      email: "",
      password: "",
      cnpj: ""
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

  const onMotoristaSubmit = async (data: z.infer<typeof motoristaSchema>) => {
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
        name: `Motorista - ${data.cpf}`,
        vehicleData
      };

      const response = await apiRequest("POST", "/api/auth/register-profile", userData);
      
      if (response.ok) {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Redirecionando para os fretes disponíveis..."
        });
        setLocation("/freights");
      } else {
        throw new Error("Erro no cadastro");
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Tente novamente ou entre em contato conosco.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onEmbarcadorSubmit = async (data: z.infer<typeof embarcadorSchema>) => {
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
        throw new Error("Erro no cadastro");
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
        name: companyData?.name || `Agenciador - ${data.documento}`,
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
        throw new Error("Erro no cadastro");
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
            {/* Link para usuários existentes */}
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Já tem uma conta?</p>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/login")}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                Fazer Login
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

            <div className="grid md:grid-cols-3 gap-6">
              {/* Motorista */}
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-blue-500"
                onClick={() => setSelectedProfile(PROFILE_TYPES.MOTORISTA)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Truck className="w-10 h-10 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl text-blue-600">SOU MOTORISTA</CardTitle>
                  <CardDescription className="text-gray-600">
                    Encontre fretes disponíveis na sua região
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>

              {/* Embarcador */}
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-green-500"
                onClick={() => setSelectedProfile(PROFILE_TYPES.EMBARCADOR)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="w-10 h-10 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl text-green-600">SOU EMBARCADOR</CardTitle>
                  <CardDescription className="text-gray-600">
                    Publique suas cargas e encontre transportadores
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>

              {/* Agenciador */}
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-orange-500"
                onClick={() => setSelectedProfile(PROFILE_TYPES.AGENCIADOR)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-orange-600" />
                  </div>
                  <CardTitle className="text-2xl text-orange-600">SOU AGENCIADOR</CardTitle>
                  <CardDescription className="text-gray-600">
                    Conecte motoristas e embarcadores
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
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
                            <FormLabel>Nome Completo</FormLabel>
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
                            <FormLabel>E-mail</FormLabel>
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
                            <FormLabel>Senha</FormLabel>
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
                            <FormLabel>CPF</FormLabel>
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
                            <FormLabel>WhatsApp</FormLabel>
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
                            <FormLabel>ANTT do Veículo</FormLabel>
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
                            <FormLabel>Placa do Veículo</FormLabel>
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
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Empresa</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome da empresa" {...field} />
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
                            <FormLabel>E-mail para contato</FormLabel>
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
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Digite sua senha (min. 6 caracteres)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={embarcadorForm.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <Input placeholder="00.000.000/0000-00" {...field} />
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
                            <FormLabel>CPF ou CNPJ</FormLabel>
                            <FormControl>
                              <Input placeholder="000.000.000-00 ou 00.000.000/0000-00" {...field} />
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
                            <FormLabel>WhatsApp</FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 99999-9999" {...field} />
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
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
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
      </div>
    </div>
  );
}