import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Schema para Step 1 - Dados Pessoais
const step1Schema = z.object({
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
});

// Schema para Step 2 - Dados da Empresa (apenas para empresas)
const step2Schema = z.object({
  companyName: z.string().min(3, "Razão social deve ter pelo menos 3 caracteres"),
  tradeName: z.string().optional(),
  cnpj: z.string().min(14, "CNPJ inválido"),
});

// Schema para Step 3 - Acesso
const step3Schema = z.object({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export default function MultiStepRegister() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(search as string);
  const userType = searchParams.get("type") as "motorista" | "empresa" || "motorista";
  
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Determinar número total de passos
  const totalSteps = userType === "empresa" ? 3 : 2; // Motoristas pulam o step 2
  const progress = (currentStep / totalSteps) * 100;

  // Form Step 1
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      email: "",
      phone: "",
      name: "",
      cpfCnpj: "",
    },
  });

  // Form Step 2
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      companyName: "",
      tradeName: "",
      cnpj: "",
    },
  });

  // Form Step 3
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    if (userType === "motorista") {
      setCurrentStep(3); // Pula para step 3 (senha)
    } else {
      setCurrentStep(2); // Vai para step 2 (dados da empresa)
    }
  };

  const onStep2Submit = (data: Step2Data) => {
    setStep2Data(data);
    setCurrentStep(3);
  };

  const onStep3Submit = async (data: Step3Data) => {
    if (!step1Data) {
      toast({
        title: "Erro",
        description: "Dados pessoais não encontrados",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Preparar dados para o backend
      const registerData = {
        email: step1Data.email,
        phone: step1Data.phone,
        name: step1Data.name,
        password: data.password,
        profileType: userType === "motorista" ? "motorista" : "embarcador",
        cpf: userType === "motorista" ? step1Data.cpfCnpj : undefined,
        cnpj: userType === "empresa" ? (step2Data?.cnpj || step1Data.cpfCnpj) : undefined,
        companyName: step2Data?.companyName,
        tradeName: step2Data?.tradeName,
        whatsapp: step1Data.phone,
      };

      const response = await apiRequest("POST", "/api/register", registerData);

      if (response.ok) {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Você será redirecionado para o login",
        });
        
        // TODO: Quando implementar verificação de telefone, redirecionar para página de verificação
        // navigate(`/auth/verify-phone?phone=${step1Data.phone}`);
        
        setTimeout(() => {
          navigate("/auth/login");
        }, 2000);
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao cadastrar",
          description: error.message || "Ocorreu um erro ao criar sua conta",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar seu cadastro",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep === 3 && userType === "motorista") {
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <div className={`flex items-center ${currentStep >= 1 ? "text-primary" : "text-slate-400"}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Dados Pessoais</span>
            </div>
            
            {userType === "empresa" && (
              <div className={`flex items-center ${currentStep >= 2 ? "text-primary" : "text-slate-400"}`}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Dados da empresa</span>
              </div>
            )}
            
            <div className={`flex items-center ${currentStep >= totalSteps ? "text-primary" : "text-slate-400"}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= totalSteps ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                {totalSteps}
              </div>
              <span className="ml-2 text-sm font-medium">Acesso</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {currentStep === 1 && "Preencha suas informações"}
              {currentStep === 2 && "Dados da empresa"}
              {currentStep === 3 && "Crie sua senha de acesso"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Informe seus dados pessoais para começar"}
              {currentStep === 2 && "Informações da sua empresa"}
              {currentStep === 3 && "Escolha uma senha segura para sua conta"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step 1 - Dados Pessoais */}
            {currentStep === 1 && (
              <Form {...form1}>
                <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
                  <FormField
                    control={form1.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email {userType === "empresa" ? "corporativo" : ""}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={userType === "empresa" ? "Ex: maria.fonseca@empresa.com" : "seu@email.com"}
                            type="email"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form1.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 0000-0000"
                            type="tel"
                            data-testid="input-phone"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          <Alert className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Ao prosseguir, você aceita receber novidades e comunicações via WhatsApp.
                            </AlertDescription>
                          </Alert>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form1.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Alexandre Menezes da Silva"
                            data-testid="input-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form1.control}
                    name="cpfCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{userType === "motorista" ? "CPF" : "CNPJ"}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={userType === "motorista" ? "Ex: 000.000.000-00" : "Ex: 00.000.000/0001-00"}
                            data-testid="input-cpf-cnpj"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/auth/user-type")}
                      className="flex-1"
                      data-testid="button-back"
                    >
                      Voltar
                    </Button>
                    <Button type="submit" className="flex-1" data-testid="button-next">
                      Avançar
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 2 - Dados da Empresa */}
            {currentStep === 2 && userType === "empresa" && (
              <Form {...form2}>
                <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
                  <FormField
                    control={form2.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razão Social</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome da empresa"
                            data-testid="input-company-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form2.control}
                    name="tradeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Fantasia (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Como a empresa é conhecida"
                            data-testid="input-trade-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form2.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00.000.000/0001-00"
                            data-testid="input-cnpj"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBack}
                      className="flex-1"
                      data-testid="button-back"
                    >
                      Voltar
                    </Button>
                    <Button type="submit" className="flex-1" data-testid="button-next">
                      Avançar
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 3 - Acesso (Senha) */}
            {currentStep === 3 && (
              <Form {...form3}>
                <form onSubmit={form3.handleSubmit(onStep3Submit)} className="space-y-4">
                  <FormField
                    control={form3.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            data-testid="input-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form3.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Digite a senha novamente"
                            data-testid="input-confirm-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBack}
                      disabled={isLoading}
                      className="flex-1"
                      data-testid="button-back"
                    >
                      Voltar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={isLoading}
                      data-testid="button-submit"
                    >
                      {isLoading ? "Cadastrando..." : "Concluir cadastro"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Já tem uma conta?
          </p>
          <button
            onClick={() => navigate("/auth/login")}
            className="text-primary hover:underline font-medium"
            data-testid="link-login"
          >
            Fazer login
          </button>
        </div>
      </div>
    </div>
  );
}
