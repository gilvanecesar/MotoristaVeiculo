import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle,
  ArrowLeft,
  SendIcon,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { Link } from "wouter";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema para validação do formulário
const reportSchema = z.object({
  issueType: z.enum(["payment", "subscription", "access", "other"], {
    required_error: "Por favor, selecione o tipo de problema",
  }),
  description: z.string().min(10, {
    message: "A descrição deve ter pelo menos 10 caracteres",
  }),
  email: z.string().email({
    message: "Formato de e-mail inválido",
  }).optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function ReportPaymentIssuePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Configurar formulário com validação Zod
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      issueType: "payment",
      description: "",
      email: user?.email || "",
    },
  });
  
  // Mutation para enviar problema
  const reportIssueMutation = useMutation({
    mutationFn: async (data: ReportFormValues) => {
      const res = await apiRequest('POST', '/api/report-payment-issue', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Problema reportado com sucesso",
        description: "Nossa equipe entrará em contato em breve.",
        variant: "default",
      });
      setIsSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reportar problema",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handler de envio do formulário
  function onSubmit(data: ReportFormValues) {
    reportIssueMutation.mutate(data);
  }
  
  // Tela de confirmação após envio bem-sucedido
  if (isSubmitted) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center gap-3 py-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h2 className="text-xl font-semibold">Problema reportado com sucesso</h2>
              <p className="text-muted-foreground max-w-md">
                Obrigado por nos informar sobre o problema. Nossa equipe analisará o caso e entrará em contato
                em até 24 horas através do e-mail informado.
              </p>
              <Button asChild className="mt-4">
                <Link href="/subscribe">
                  Voltar para gerenciamento de assinatura
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Reportar Problema</h1>
          <p className="text-muted-foreground">Informe problema relacionado a pagamento ou assinatura</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href="/subscribe">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preencha os detalhes do problema</CardTitle>
            <CardDescription>
              Descreva o problema com detalhes para que possamos ajudar melhor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="issueType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de problema</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="payment" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Problema com pagamento
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="subscription" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Problema com assinatura
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="access" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Problema de acesso após pagamento
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="other" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Outro tipo de problema
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do problema</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva detalhadamente o problema que está enfrentando..."
                          className="resize-none min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Inclua qualquer informação relevante que possa nos ajudar a resolver o problema.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail para contato (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu-email@exemplo.com"
                          type="email"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Se diferente do seu e-mail cadastrado, informe um e-mail para contato.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={reportIssueMutation.isPending}
                >
                  {reportIssueMutation.isPending ? (
                    "Enviando..."
                  ) : (
                    <>
                      <SendIcon className="h-4 w-4 mr-2" />
                      Enviar Relato
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tempo de resposta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nossa equipe analisa relatos de problemas em até 24 horas em dias úteis.
                Para casos urgentes, entre em contato pelo telefone.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Problemas comuns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Pagamento realizado mas assinatura inativa
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pode levar até 5 minutos para que os pagamentos sejam confirmados. Se após esse tempo
                  a assinatura continuar inativa, reporte o problema.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Múltiplas cobranças
                </h3>
                <p className="text-xs text-muted-foreground">
                  Se você recebeu cobranças duplicadas, informe os detalhes incluindo datas e valores
                  para que possamos verificar e resolver.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Cancelamento não efetivado
                </h3>
                <p className="text-xs text-muted-foreground">
                  Se você solicitou um cancelamento que não foi processado, informe a data da solicitação
                  para que possamos verificar.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Para questões relacionadas a suporte técnico não relacionadas a pagamentos, 
              utilize a seção de suporte em Configurações.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}