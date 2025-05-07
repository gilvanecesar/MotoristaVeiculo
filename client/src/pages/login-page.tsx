import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
// Definição do ícone Google diretamente
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      width="24"
      height="24"
    >
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
      />
    </svg>
  );
}

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
  const [selectedPlan, setSelectedPlan] = useState<string>("trial");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  
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

  const onLoginSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo à plataforma Quero Fretes",
        });
        
        // Se um plano não gratuito foi selecionado, redireciona para o checkout
        if (selectedPlan !== "trial") {
          window.location.href = `/checkout?plan=${selectedPlan}`;
        } else {
          // Caso contrário, redireciona para a página de dashboard
          window.location.href = "/dashboard";
        }
      },
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const registerData = {
      ...data,
      profileType: selectedRole,
      subscriptionType: selectedPlan,
    };

    registerMutation.mutate(registerData, {
      onSuccess: () => {
        toast({
          title: "Conta criada com sucesso",
          description: selectedPlan === "trial" 
            ? "Seu período de teste de 7 dias foi iniciado" 
            : "Para continuar, finalize o pagamento do plano selecionado",
        });
        
        if (selectedPlan === "trial") {
          // Forçar o redirecionamento para a página do dashboard
          window.location.href = "/dashboard";
        } else if (selectedPlan === "monthly") {
          window.location.href = "/checkout?plan=monthly";
        } else {
          window.location.href = "/checkout?plan=annual";
        }
      },
    });
  };

  // Função para solicitar redefinição de senha
  const handlePasswordReset = async () => {
    if (!resetEmail) return;
    
    setIsRequestingReset(true);
    
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao solicitar redefinição de senha');
      }
      
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
      });
      
      setForgotPasswordOpen(false);
      setResetEmail("");
    } catch (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Falha ao solicitar redefinição de senha',
        variant: "destructive",
      });
    } finally {
      setIsRequestingReset(false);
    }
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
            <Card 
              className={`shadow-lg hover:shadow-xl transition-shadow cursor-pointer ${selectedPlan === "trial" ? "border-primary ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedPlan("trial")}
            >
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
                <Button 
                  className={`w-full ${selectedPlan === "trial" ? "bg-primary" : "bg-primary/10 hover:bg-primary/20 text-primary"}`}
                  variant={selectedPlan === "trial" ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan("trial");
                  }}
                >
                  {selectedPlan === "trial" ? "Selecionado" : "Selecionar"}
                </Button>
              </CardContent>
            </Card>
            
            {/* Plano Mensal */}
            <Card 
              className={`shadow-lg hover:shadow-xl transition-shadow cursor-pointer ${selectedPlan === "monthly" ? "border-primary ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedPlan("monthly")}
            >
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
                <Button 
                  className={`w-full ${selectedPlan === "monthly" ? "bg-primary" : "bg-primary/10 hover:bg-primary/20 text-primary"}`}
                  variant={selectedPlan === "monthly" ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan("monthly");
                  }}
                >
                  {selectedPlan === "monthly" ? "Selecionado" : "Selecionar"}
                </Button>
              </CardContent>
            </Card>
            
            {/* Plano Anual */}
            <Card 
              className={`shadow-lg hover:shadow-xl transition-shadow cursor-pointer ${selectedPlan === "annual" ? "border-primary ring-2 ring-primary" : "border-primary"}`}
              onClick={() => setSelectedPlan("annual")}
            >
              <CardHeader className="bg-primary/10 pb-3">
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-full">Mais Popular</span>
                </div>
                <CardTitle className="text-xl">Anual</CardTitle>
                <CardDescription>Acesso por 1 ano completo</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-center mb-2">R$ 960,00</div>
                <div className="text-sm text-center mb-4 text-muted-foreground">Apenas R$ 80,00/mês</div>
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
                    Pagamento único anual
                  </li>
                </ul>
                <Button 
                  className={`w-full ${selectedPlan === "annual" ? "bg-primary" : "bg-primary/10 hover:bg-primary/20 text-primary"}`}
                  variant={selectedPlan === "annual" ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan("annual");
                  }}
                >
                  {selectedPlan === "annual" ? "Selecionado" : "Selecionar"}
                </Button>
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
                      
                      <div className="text-right mt-2">
                        <Button variant="link" className="text-sm p-0" type="button" onClick={() => setForgotPasswordOpen(true)}>
                          Esqueci minha senha
                        </Button>
                      </div>
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
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
                        className={`cursor-pointer transition-all hover:bg-muted ${selectedRole === USER_TYPES.CARRIER ? 'border-primary ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedRole(USER_TYPES.CARRIER)}
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
                      
                      <Card 
                        className={`cursor-pointer transition-all hover:bg-muted ${selectedRole === USER_TYPES.DRIVER ? 'border-green-500 ring-2 ring-green-500' : ''}`}
                        onClick={() => setSelectedRole(USER_TYPES.DRIVER)}
                      >
                        <CardContent className="p-3 text-center">
                          <Icons.truck className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-xs font-medium">Motorista</p>
                          <p className="text-[10px] mt-1 text-green-600">Acesso Gratuito</p>
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
      
      {/* Modal de recuperação de senha */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperação de senha</DialogTitle>
            <DialogDescription>
              Digite seu e-mail para receber um link de recuperação de senha.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-email">E-mail de cadastro</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="seu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setForgotPasswordOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              disabled={isRequestingReset || !resetEmail}
              onClick={handlePasswordReset}
            >
              {isRequestingReset ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar link"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}