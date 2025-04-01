import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { USER_TYPES } from "@shared/schema";
import { GoogleIcon } from "@/components/ui/social-icons";

// Importando a logo da empresa
import logoQueroFretes from "@assets/QUEROFRETES BOLINHA.png";

// Esquemas de validação
const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

const registerSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [selectedRole, setSelectedRole] = useState<string>(USER_TYPES.SHIPPER);
  
  const { toast } = useToast();
  const { loginMutation, registerMutation } = useAuth();
  const [_, navigate] = useLocation();

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

  const onRegisterSubmit = (data: RegisterFormValues) => {
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
        navigate("/auth");
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex items-center py-4">
          <img src={logoQueroFretes} alt="QUERO FRETES" className="h-10 mr-4" />
          <h1 className="text-lg font-bold">QUERO FRETES</h1>
          <div className="ml-auto text-sm text-muted-foreground">
            Sistema de gerenciamento de cargas
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-screen-xl mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Nossos Planos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plano de Teste */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-primary/5 pb-3">
                <CardTitle className="text-xl">Teste Grátis</CardTitle>
                <CardDescription>Teste por 7 dias</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-center mb-2">Grátis</div>
                <div className="text-sm text-center mb-4 text-muted-foreground">Acesso completo por 7 dias</div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm">
                    <Icons.check className="mr-2 h-4 w-4 text-primary" />
                    Gerenciamento de fretes
                  </li>
                  <li className="flex items-center text-sm">
                    <Icons.check className="mr-2 h-4 w-4 text-primary" />
                    Cadastro de motoristas e veículos
                  </li>
                  <li className="flex items-center text-sm">
                    <Icons.check className="mr-2 h-4 w-4 text-primary" />
                    Acesso a relatórios básicos
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            {/* Plano Mensal */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-primary/5 pb-3">
                <CardTitle className="text-xl">Mensal</CardTitle>
                <CardDescription>Acesso por 30 dias</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-center mb-2">R$ 99,90</div>
                <div className="text-sm text-center mb-4 text-muted-foreground">Cobrado a cada mês</div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm">
                    <Icons.check className="mr-2 h-4 w-4 text-primary" />
                    Gerenciamento ilimitado de fretes
                  </li>
                  <li className="flex items-center text-sm">
                    <Icons.check className="mr-2 h-4 w-4 text-primary" />
                    Cadastro ilimitado de motoristas
                  </li>
                  <li className="flex items-center text-sm">
                    <Icons.check className="mr-2 h-4 w-4 text-primary" />
                    Relatórios avançados
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            {/* Plano Anual */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow border-primary">
              <CardHeader className="bg-primary/10 pb-3">
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-full">Mais Popular</span>
                </div>
                <CardTitle className="text-xl">Anual</CardTitle>
                <CardDescription>Acesso por 1 ano completo</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-center mb-2">R$ 1.198,80</div>
                <div className="text-sm text-center mb-4 text-muted-foreground">Apenas R$ 99,90/mês</div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm">
                    <Icons.check className="mr-2 h-4 w-4 text-primary" />
                    Todas as funcionalidades do plano mensal
                  </li>
                  <li className="flex items-center text-sm">
                    <Icons.check className="mr-2 h-4 w-4 text-primary" />
                    Suporte prioritário
                  </li>
                  <li className="flex items-center text-sm">
                    <Icons.check className="mr-2 h-4 w-4 text-primary" />
                    Economize 2 meses por ano
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="w-full max-w-md">
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
                <div className="pt-6 flex flex-col space-y-4">
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
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                </div>
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
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <footer className="py-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} QUERO FRETES. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}