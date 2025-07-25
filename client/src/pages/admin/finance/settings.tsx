import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Save, UserPlus, BadgeCheck, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema de validação para configurações de faturamento
const billingSettingsSchema = z.object({
  automaticBilling: z.boolean().default(true),
  gracePeriod: z.number().int().min(0).max(30).default(3),
  reminderDays: z.number().int().min(1).max(14).default(3),
  // Configurações do Stripe removidas - apenas OpenPix agora
  enableInvoices: z.boolean().default(true),
  customInvoicePrefix: z.string().optional(),
  invoiceNotes: z.string().optional(),
});

type BillingSettingsFormValues = z.infer<typeof billingSettingsSchema>;

// Schema de validação para configurações do plano
const planSettingsSchema = z.object({
  monthlyPrice: z.number().min(0).step(0.01),
  yearlyPrice: z.number().min(0).step(0.01),
  trialDays: z.number().int().min(0).max(30),
  planName: z.string().min(3),
  planDescription: z.string(),
  enableTrialPeriod: z.boolean(),
  // Configurações do Stripe removidas - apenas OpenPix agora
});

type PlanSettingsFormValues = z.infer<typeof planSettingsSchema>;

// Componente principal de configurações financeiras
// Interface para resposta manual
interface ManualResponse {
  type: 'success' | 'error';
  message: string;
}

export default function FinanceSettingsPage() {
  const [activeTab, setActiveTab] = useState("billing");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPlanType, setManualPlanType] = useState("monthly");
  const [manualAmount, setManualAmount] = useState("80.00");
  const [manualResponse, setManualResponse] = useState<ManualResponse | null>(null);
  const { toast } = useToast();

  // Buscar configurações existentes
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/finance/settings"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Configurar formulário de faturamento
  const billingForm = useForm<BillingSettingsFormValues>({
    resolver: zodResolver(billingSettingsSchema),
    defaultValues: {
      automaticBilling: settings?.automaticBilling ?? true,
      gracePeriod: settings?.gracePeriod ?? 3,
      reminderDays: settings?.reminderDays ?? 3,
      // Configurações do Stripe removidas
      enableInvoices: settings?.enableInvoices ?? true,
      customInvoicePrefix: settings?.customInvoicePrefix ?? "",
      invoiceNotes: settings?.invoiceNotes ?? "",
    },
  });

  // Configurar formulário de planos
  const planForm = useForm<PlanSettingsFormValues>({
    resolver: zodResolver(planSettingsSchema),
    defaultValues: {
      monthlyPrice: settings?.monthlyPrice ?? 49.90,
      yearlyPrice: settings?.yearlyPrice ?? 598.80,
      trialDays: settings?.trialDays ?? 7,
      planName: settings?.planName ?? "Premium",
      planDescription: settings?.planDescription ?? "Acesso completo a todas as funcionalidades",
      enableTrialPeriod: settings?.enableTrialPeriod ?? true,
      // Configurações do Stripe removidas
    },
  });

  // Atualizar valores do formulário quando os dados são carregados
  useEffect(() => {
    if (settings) {
      billingForm.reset({
        automaticBilling: settings.automaticBilling ?? true,
        gracePeriod: settings.gracePeriod ?? 3,
        reminderDays: settings.reminderDays ?? 3,
        // Configurações do Stripe removidas
        enableInvoices: settings.enableInvoices ?? true,
        customInvoicePrefix: settings.customInvoicePrefix ?? "",
        invoiceNotes: settings.invoiceNotes ?? "",
      });

      planForm.reset({
        monthlyPrice: settings.monthlyPrice ?? 49.90,
        yearlyPrice: settings.yearlyPrice ?? 598.80,
        trialDays: settings.trialDays ?? 7,
        planName: settings.planName ?? "Premium",
        planDescription: settings.planDescription ?? "Acesso completo a todas as funcionalidades",
        enableTrialPeriod: settings.enableTrialPeriod ?? true,
        // Configurações do Stripe removidas
      });
    }
  }, [settings, billingForm, planForm]);

  // Mutation para salvar as configurações
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/finance/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance/settings"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações financeiras foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações.",
      });
    },
  });
  
  // Mutation para ativação manual de assinatura
  const activateManualMutation = useMutation({
    mutationFn: async (data: { email: string; planType: string; amount: string }) => {
      try {
        // Usar a rota específica para ativação manual
        console.log("Enviando requisição para ativação manual:", data);
        const response = await apiRequest(
          "POST", 
          "/api/admin/activate-subscription-manual", 
          data
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Erro retornado pela API:", errorData);
          throw new Error(errorData.error?.message || "Erro ao ativar assinatura");
        }
        
        const jsonData = await response.json();
        console.log("Resposta da ativação manual:", jsonData);
        return jsonData;
      } catch (error) {
        console.error("Erro ao ativar assinatura:", error);
        throw new Error("Erro ao ativar assinatura. Verifique se o email existe no sistema.");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance/stats"] });
      
      setManualResponse({
        type: 'success',
        message: `Assinatura ativada com sucesso para ${manualEmail}!`
      });
      
      toast({
        title: "Assinatura ativada",
        description: `A assinatura foi ativada manualmente para ${manualEmail}.`,
      });
    },
    onError: (error: any) => {
      setManualResponse({
        type: 'error',
        message: error.message || "Erro ao ativar a assinatura. Verifique se o email existe no sistema."
      });
      
      toast({
        variant: "destructive",
        title: "Erro ao ativar assinatura",
        description: error.message || "Ocorreu um erro ao ativar a assinatura.",
      });
    },
  });

  // Handler para salvar configurações de faturamento
  const handleSaveBillingSettings = (values: BillingSettingsFormValues) => {
    saveMutation.mutate({
      ...values,
      type: "billing",
    });
  };

  // Handler para salvar configurações de plano
  const handleSavePlanSettings = (values: PlanSettingsFormValues) => {
    saveMutation.mutate({
      ...values,
      type: "plan",
    });
  };
  
  // Handler para ativar assinatura manualmente
  const handleActivateManual = () => {
    setManualResponse(null);
    activateManualMutation.mutate({
      email: manualEmail,
      planType: manualPlanType,
      amount: manualAmount
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/finance">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Configurações Financeiras</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="manual">Ativação Manual</TabsTrigger>
        </TabsList>
        
        {/* Tab: Configurações de Faturamento */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Faturamento</CardTitle>
              <CardDescription>
                Configure as preferências de faturamento, cobranças e notificações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...billingForm}>
                <form onSubmit={billingForm.handleSubmit(handleSaveBillingSettings)} className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cobranças Automáticas</h3>
                    
                    <FormField
                      control={billingForm.control}
                      name="automaticBilling"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Cobrança Automática</FormLabel>
                            <FormDescription>
                              Ativar cobrança automática para assinaturas
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={billingForm.control}
                        name="gracePeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Período de Carência (dias)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                min={0}
                                max={30}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Dias de carência antes de desativar assinaturas não pagas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={billingForm.control}
                        name="reminderDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lembrete de Pagamento (dias)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                min={1}
                                max={14}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Dias antes do vencimento para enviar lembretes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Configurações de Notas Fiscais</h3>
                    
                    <FormField
                      control={billingForm.control}
                      name="enableInvoices"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Gerar Notas Fiscais</FormLabel>
                            <FormDescription>
                              Emitir notas fiscais automaticamente após pagamento
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={billingForm.control}
                      name="customInvoicePrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prefixo Personalizado</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="NF-"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Prefixo customizado para notas fiscais (opcional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={billingForm.control}
                      name="invoiceNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações Padrão</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Observações que aparecerão em todas as notas fiscais"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Texto padrão a ser incluído em todas as notas fiscais
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Seção do Stripe removida - apenas OpenPix agora */}
                  
                  <Button 
                    type="submit"
                    className="w-full md:w-auto" 
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Configurações de Planos */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Planos</CardTitle>
              <CardDescription>
                Configure os planos de assinatura disponíveis e seus preços.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...planForm}>
                <form onSubmit={planForm.handleSubmit(handleSavePlanSettings)} className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Plano Premium</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={planForm.control}
                        name="planName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Plano</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Premium"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Campo Stripe Price ID removido - apenas OpenPix agora */}
                    </div>
                    
                    <FormField
                      control={planForm.control}
                      name="planDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição do Plano</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Acesso completo a todas as funcionalidades"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={planForm.control}
                        name="monthlyPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço Mensal (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Valor mensal do plano
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={planForm.control}
                        name="yearlyPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço Anual (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Valor total para assinatura anual
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Período de Teste</h3>
                    
                    <FormField
                      control={planForm.control}
                      name="enableTrialPeriod"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativar Período de Teste</FormLabel>
                            <FormDescription>
                              Permitir que novos usuários experimentem o sistema gratuitamente
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={planForm.control}
                      name="trialDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duração do Período de Teste (dias)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={30}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              disabled={!planForm.watch("enableTrialPeriod")}
                            />
                          </FormControl>
                          <FormDescription>
                            Número de dias para testar o sistema antes da primeira cobrança
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full md:w-auto" 
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      
      {/* Tab: Ativação Manual de Assinaturas */}
      <TabsContent value="manual">
        <Card>
          <CardHeader>
            <CardTitle>Ativação Manual de Assinaturas</CardTitle>
            <CardDescription>
              Ative manualmente uma assinatura para um usuário específico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Ativar Assinatura</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userEmail">Email do Usuário</Label>
                      <Input 
                        id="userEmail" 
                        placeholder="example@email.com" 
                        value={manualEmail} 
                        onChange={(e) => setManualEmail(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Email do usuário para ativar a assinatura
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="planType">Tipo de Plano</Label>
                      <Select 
                        value={manualPlanType} 
                        onValueChange={setManualPlanType}
                      >
                        <SelectTrigger id="planType">
                          <SelectValue placeholder="Selecione o tipo de plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Tipo de plano a ser ativado
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input 
                      id="amount" 
                      placeholder="99.90" 
                      value={manualAmount} 
                      onChange={(e) => setManualAmount(e.target.value)} 
                    />
                    <p className="text-sm text-muted-foreground">
                      Valor cobrado pela assinatura
                    </p>
                  </div>
                  
                  {manualResponse && (
                    <div className={`p-4 rounded-md ${
                      manualResponse.type === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {manualResponse.type === 'success' ? (
                            <BadgeCheck className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium">
                            {manualResponse.type === 'success' ? 'Sucesso!' : 'Erro!'}
                          </h3>
                          <div className="mt-1 text-sm">
                            {manualResponse.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleActivateManual} 
                    disabled={!manualEmail || !manualPlanType || !manualAmount || activateManualMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {activateManualMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Ativar Assinatura
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
}