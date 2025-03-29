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
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Google Icon Component
const GoogleIcon = () => (
  <svg 
    className="mr-2 h-4 w-4" 
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
    />
  </svg>
);

// Importando a logo da empresa ou usando uma imagem de placeholder
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
  const [subscriptionType, setSubscriptionType] = useState<string>("monthly"); // "monthly" ou "annual"
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
  if (user) {
    // Se o usuário tem assinatura ativa, redireciona para o dashboard
    if (user.subscriptionActive) {
      navigate("/dashboard");
      return null;
    }
    
    // Se o usuário está logado mas não tem assinatura, mostra a página de planos
    setShowPlans(true);
  }

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
      onSuccess: () => {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo à plataforma Quero Fretes",
        });
        navigate("/dashboard");
      },
    });
  };

  // Função para iniciar o processo de pagamento
  const initiateCheckout = async (type: string = "monthly") => {
    setIsLoadingCheckout(true);
    try {
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        subscriptionType: type
      });
      
      if (!response.ok) {
        throw new Error("Erro ao iniciar o processo de pagamento");
      }
      
      const data = await response.json();
      
      // Redireciona para a página de checkout do Stripe
      window.location.href = data.url;
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: "Ocorreu um erro ao iniciar o processo de pagamento. Tente novamente.",
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
        toast({
          title: "Conta criada com sucesso",
          description: "Para continuar, é necessário assinar um plano",
        });
        // Após o cadastro, exibe a página de planos
        setShowPlans(true);
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  "Continuar para pagamento"
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                Você será redirecionado para a plataforma segura do Stripe para finalizar seu pagamento.
              </p>
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
                    <h3 className="text-sm font-medium mb-3">Selecione seu perfil:</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <Card 
                        className={`cursor-pointer transition-all hover:bg-muted ${selectedRole === USER_TYPES.SHIPPER ? 'border-primary ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedRole(USER_TYPES.SHIPPER)}
                      >
                        <CardContent className="p-3 text-center">
                          <Icons.building className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-xs font-medium">Embarcador</p>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-all hover:bg-muted ${selectedRole === USER_TYPES.DRIVER ? 'border-primary ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedRole(USER_TYPES.DRIVER)}
                      >
                        <CardContent className="p-3 text-center">
                          <Icons.truck className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-xs font-medium">Transportador</p>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-all hover:bg-muted ${selectedRole === USER_TYPES.AGENT ? 'border-primary ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedRole(USER_TYPES.AGENT)}
                      >
                        <CardContent className="p-3 text-center">
                          <Icons.package className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-xs font-medium">Agente</p>
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