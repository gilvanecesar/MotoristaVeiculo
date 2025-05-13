import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { userValidator } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { USER_TYPES } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Importando a logo da empresa
import logoQueroFretes from "@assets/QUEROFRETES BOLINHA.png";

// Esquemas de validação
const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

const registerSchema = userValidator.pick({
  name: true,
  email: true,
  password: true,
  profileType: true,
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [selectedRole, setSelectedRole] = useState<string>(USER_TYPES.SHIPPER);
  const [subscriptionType, setSubscriptionType] = useState<string>("monthly");
  const [showPlans, setShowPlans] = useState<boolean>(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<boolean>(false);
  const [subscriptionRequired, setSubscriptionRequired] = useState<boolean>(false);
  
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  const [_, navigate] = useLocation();
  const [__, params] = useRoute("/auth?subscription=:status");
  
  // Verifica se precisa mostrar o alerta de assinatura
  useEffect(() => {
    if (params && params.status === "required") {
      setSubscriptionRequired(true);
    }
  }, [params]);

  // Redirecionamento se o usuário já estiver logado
  useEffect(() => {
    if (user) {
      // Se o usuário tem assinatura ativa, redireciona para a página de dashboard/home
      if (user.subscriptionActive) {
        navigate("/home");
      } else {
        // Se o usuário está logado mas não tem assinatura, mostra a página de planos
        setShowPlans(true);
      }
    }
  }, [user, navigate]);

  // Formulário de login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Formulário de registro
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      profileType: USER_TYPES.SHIPPER,
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: (user) => {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo à plataforma Quero Fretes",
        });
        
        // Se for motorista, redireciona direto para fretes (sem precisar de pagamento)
        if (user.profileType === USER_TYPES.DRIVER) {
          // Ativa o acesso de motorista automaticamente, se ainda não estiver ativo
          if (!user.subscriptionActive || user.subscriptionType !== "driver_free") {
            apiRequest("POST", "/api/activate-driver-access", {})
              .then(() => {
                navigate("/freights");
              })
              .catch((error) => {
                console.error("Erro ao ativar acesso de motorista:", error);
                navigate("/auth?subscription=required");
              });
          } else {
            navigate("/freights");
          }
        } else if (user.subscriptionActive) {
          // Se já tem assinatura ativa, vai para a página inicial
          navigate("/");
        } else {
          // Se não tem assinatura ativa e não é motorista, mostra página de planos
          setShowPlans(true);
          setSubscriptionRequired(true);
        }
      },
    });
  };

  // Função para iniciar o processo de pagamento ou teste gratuito
  const initiateCheckout = async (type: string = "monthly") => {
    setIsLoadingCheckout(true);
    try {
      // Se for teste gratuito, não passa pelo Stripe
      if (type === "trial") {
        // Ativa o período de teste diretamente, sem pagamento
        const response = await apiRequest("POST", "/api/activate-trial", {
          subscriptionType: type
        });
        
        if (!response.ok) {
          throw new Error("Erro ao iniciar o período de teste");
        }
        
        // Obtém a resposta do servidor
        const data = await response.json();
        
        toast({
          title: "Teste gratuito ativado",
          description: "Seu acesso gratuito de 7 dias foi ativado com sucesso!",
        });
        
        // Atualiza o cache de usuário para incluir as informações de assinatura
        // Isso evita que o usuário tenha que fazer login novamente
        queryClient.invalidateQueries({queryKey: ["/api/user"]});
        
        // Força uma nova consulta para obter os dados atualizados do usuário antes de navegar
        queryClient.fetchQuery({queryKey: ["/api/user"]})
          .then(() => {
            // Redireciona diretamente para a página de fretes após atualizar o cache
            navigate("/freights");
          });
        
        return; // Importante adicionar o return para não continuar o código
      } else {
        // Processamento normal via Stripe para planos pagos
        const response = await apiRequest("POST", "/api/create-checkout-session", {
          subscriptionType: type
        });
        
        if (!response.ok) {
          throw new Error("Erro ao iniciar o processo de pagamento");
        }
        
        const data = await response.json();
        
        // Redireciona para a página de checkout do Stripe
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      toast({
        title: "Erro ao processar solicitação",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Adiciona o profileType selecionado
    const registerData = {
      ...data,
      profileType: selectedRole,
    };

    registerMutation.mutate(registerData, {
      onSuccess: () => {
        // Se for motorista, ativa o acesso gratuito automaticamente
        if (selectedRole === USER_TYPES.DRIVER) {
          // Ativa o acesso gratuito para motoristas
          apiRequest("POST", "/api/activate-driver-access", {})
            .then((response) => {
              if (response.ok) {
                toast({
                  title: "Cadastro de motorista realizado",
                  description: "Seu acesso gratuito foi ativado! Você pode acessar fretes, veículos e motoristas.",
                });
                // Redireciona diretamente para a página de fretes
                navigate("/freights");
              } else {
                throw new Error("Erro ao ativar acesso de motorista");
              }
            })
            .catch((error) => {
              console.error("Erro ao ativar acesso:", error);
              toast({
                title: "Erro ao ativar acesso",
                description: "Não foi possível ativar seu acesso gratuito. Tente novamente.",
                variant: "destructive",
              });
              setShowPlans(true);
            });
        } else {
          // Para outros tipos de perfil, mostra a página de planos
          toast({
            title: "Conta criada com sucesso",
            description: "Para continuar, é necessário assinar um plano",
          });
          // Após o cadastro, exibe a página de planos
          setShowPlans(true);
        }
      },
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Seção de Formulário */}
      <div className="flex items-center justify-center w-full lg:w-1/2 px-6 py-8">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={logoQueroFretes} alt="QUERO FRETES" className="h-16" />
          </div>
          
          {/* Alerta para assinatura necessária */}
          {subscriptionRequired && (
            <Alert className="mb-6 border-yellow-500">
              <Icons.warning className="h-4 w-4 text-yellow-500" />
              <AlertTitle>Assinatura necessária</AlertTitle>
              <AlertDescription>
                Para continuar usando a plataforma, é necessário assinar um plano.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Página de planos de assinatura */}
          {showPlans ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Escolha seu plano</h2>
              <p className="text-center text-muted-foreground">
                Para acessar a plataforma QUERO FRETES, escolha um dos planos abaixo:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Teste Gratuito */}
                <Card className={`cursor-pointer transition-all hover:shadow-md ${subscriptionType === "trial" ? 'border-primary ring-2 ring-primary' : ''}`}
                      onClick={() => setSubscriptionType("trial")}>
                  <CardHeader className="pb-3">
                    <CardTitle>Teste Gratuito</CardTitle>
                    <CardDescription>Acesso por 7 dias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">Grátis</div>
                    <p className="text-sm text-muted-foreground">Experimente sem compromisso</p>
                  </CardContent>
                </Card>
                
                {/* Plano Mensal */}
                <Card className={`cursor-pointer transition-all hover:shadow-md ${subscriptionType === "monthly" ? 'border-primary ring-2 ring-primary' : ''}`}
                      onClick={() => setSubscriptionType("monthly")}>
                  <CardHeader className="pb-3">
                    <CardTitle>Mensal</CardTitle>
                    <CardDescription>Acesso por 30 dias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">R$ 99,90</div>
                    <p className="text-sm text-muted-foreground">Cobrado a cada mês</p>
                  </CardContent>
                </Card>
                
                {/* Plano Anual */}
                <Card className={`cursor-pointer transition-all hover:shadow-md ${subscriptionType === "annual" ? 'border-primary ring-2 ring-primary' : ''}`}
                      onClick={() => setSubscriptionType("annual")}>
                  <CardHeader className="pb-3">
                    <CardTitle>Anual</CardTitle>
                    <CardDescription>Acesso por 1 ano completo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">R$ 1.198,80</div>
                    <p className="text-sm text-muted-foreground">Apenas R$ 99,90/mês</p>
                  </CardContent>
                </Card>
              </div>
              
              <Button 
                className="w-full mt-6" 
                onClick={() => initiateCheckout(subscriptionType)}
                disabled={isLoadingCheckout}
              >
                {isLoadingCheckout ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  subscriptionType === "trial" ? "Iniciar período de teste gratuito" : "Continuar para pagamento"
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                {subscriptionType === "trial" 
                  ? "O acesso de teste gratuito será ativado imediatamente por 7 dias." 
                  : "Você será redirecionado para a plataforma segura do Stripe para finalizar seu pagamento."}
              </p>
              
              {/* Acesso gratuito para motoristas */}
              <div className="mt-8 pt-6 border-t">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Motorista?</h3>
                  <div className="inline-flex items-center">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Acesso 100% gratuito</span>
                  </div>
                </div>
                
                <Card className="border-dashed border-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mr-4">
                        <Icons.truck className="h-8 w-8 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Motoristas têm acesso gratuito</h4>
                        <p className="text-sm text-muted-foreground">
                          Acesse fretes disponíveis, cadastre seus veículos e gerencie seus dados.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-md p-3 mb-4">
                      <div className="flex items-start">
                        <Icons.check className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Acesso às páginas:</p>
                          <p className="text-sm text-green-700">Fretes, veículos e motoristas</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-green-500 text-green-700 hover:bg-green-50"
                      onClick={() => {
                        // Define o usuário como motorista
                        setSelectedRole(USER_TYPES.DRIVER);
                        // Ativa a aba de cadastro
                        setActiveTab("register");
                        // Esconde os planos
                        setShowPlans(false);
                      }}
                    >
                      Cadastrar-me como motorista
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Cadastro</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>
                      Entre com seu e-mail e senha para acessar a plataforma.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input placeholder="seu@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="******" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                              Entrando...
                            </>
                          ) : (
                            "Entrar"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="relative w-full">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground">
                          ou continue com
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full" disabled>
                      <Icons.google className="mr-2 h-4 w-4" />
                      Google
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Criar conta</CardTitle>
                    <CardDescription>
                      Preencha os campos abaixo para se cadastrar na plataforma.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <h3 className="text-xl font-medium mb-3 text-center">Selecione seu perfil:</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-lg ${selectedRole === USER_TYPES.SHIPPER ? 'border-primary ring-2 ring-primary' : ''}`}
                          onClick={() => setSelectedRole(USER_TYPES.SHIPPER)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                                <Icons.building className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium text-base">Embarcador</h4>
                                <p className="text-sm text-muted-foreground">Anuncie suas cargas e encontre transportadores</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-lg ${selectedRole === USER_TYPES.AGENT ? 'border-primary ring-2 ring-primary' : ''}`}
                          onClick={() => setSelectedRole(USER_TYPES.AGENT)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                                <Icons.package className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium text-base">Agente</h4>
                                <p className="text-sm text-muted-foreground">Gerencie fretes e conecte embarcadores e transportadores</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-lg border-green-500 ${selectedRole === USER_TYPES.DRIVER ? 'ring-2 ring-green-500' : ''}`}
                          onClick={() => setSelectedRole(USER_TYPES.DRIVER)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mr-4">
                                <Icons.truck className="h-6 w-6 text-green-500" />
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <h4 className="font-medium text-base">Motorista</h4>
                                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Acesso gratuito</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Acesse fretes, cadastre seus veículos e encontre cargas</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome e sobrenome" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input placeholder="seu@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="******" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            "Cadastrar"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="relative w-full">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground">
                          ou continue com
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full" disabled>
                      <Icons.google className="mr-2 h-4 w-4" />
                      Google
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Seção Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-primary to-primary-foreground text-white">
        <div className="max-w-lg p-12 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold mb-6">
            QUERO FRETES
          </h1>
          <h2 className="text-2xl font-semibold mb-8">
            Plataforma de gestão de transportes
          </h2>
          <p className="text-lg mb-4">
            Conectando transportadores, embarcadores e agentes de forma simples e eficiente.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Cadastre motoristas e seus veículos
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Gerencie fretes e clientes
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Acompanhe rotas e entregue com segurança
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Análise completa com relatórios detalhados
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}