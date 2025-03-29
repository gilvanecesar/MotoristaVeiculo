import { useState } from "react";
import { useLocation } from "wouter";
import { CreditCard, ArrowLeft, Save } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Esquema de validação do formulário
const financeSettingsSchema = z.object({
  companyName: z.string().min(2, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 dígitos"),
  address: z.string().min(5, "Endereço completo é obrigatório"),
  cityState: z.string().min(2, "Cidade/Estado é obrigatório"),
  zipCode: z.string().min(5, "CEP é obrigatório"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  email: z.string().email("E-mail inválido"),
  bankName: z.string().min(2, "Nome do banco é obrigatório"),
  bankAccount: z.string().min(5, "Conta bancária é obrigatória"),
  bankBranch: z.string().min(1, "Agência bancária é obrigatória"),
  pixKey: z.string().min(5, "Chave PIX é obrigatória"),
  invoiceNotes: z.string().optional(),
  autoRenewal: z.boolean().default(true),
  sendReminders: z.boolean().default(true),
  notifyCustomers: z.boolean().default(true),
});

type FinanceSettingsForm = z.infer<typeof financeSettingsSchema>;

// Dados iniciais simulados
const defaultValues: FinanceSettingsForm = {
  companyName: "QUERO FRETES LTDA",
  cnpj: "12.345.678/0001-99",
  address: "Av. Paulista, 1000, Sala 101",
  cityState: "São Paulo/SP",
  zipCode: "01310-100",
  phone: "(11) 99999-9999",
  email: "financeiro@querofretes.com.br",
  bankName: "Banco do Brasil",
  bankAccount: "12345-6",
  bankBranch: "1234-5",
  pixKey: "12.345.678/0001-99",
  invoiceNotes: "Pagamento referente à assinatura anual do sistema QUERO FRETES",
  autoRenewal: true,
  sendReminders: true,
  notifyCustomers: true,
};

export default function FinanceSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FinanceSettingsForm>({
    resolver: zodResolver(financeSettingsSchema),
    defaultValues,
  });

  const onSubmit = (values: FinanceSettingsForm) => {
    // Em produção, enviaria os dados para o backend
    console.log(values);
    toast({
      title: "Configurações salvas",
      description: "As configurações financeiras foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setLocation("/admin/finance")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Configurações Financeiras</h1>
        </div>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          className="gap-2"
        >
          <Save className="h-4 w-4" /> Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
            <CardDescription>
              Detalhes da empresa que aparecem nas faturas e documentos financeiros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cityState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade/Estado</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail Financeiro</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Bancárias</CardTitle>
            <CardDescription>
              Dados bancários para recebimento de pagamentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Banco</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankBranch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agência</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="pixKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave PIX</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações da Fatura</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Informações adicionais que aparecerão nas faturas"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Cobrança</CardTitle>
          <CardDescription>
            Defina como as cobranças e notificações serão gerenciadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="autoRenewal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Renovação Automática</FormLabel>
                        <FormDescription>
                          Renovar automaticamente as assinaturas ao vencerem
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
                  control={form.control}
                  name="sendReminders"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Lembretes de Pagamento</FormLabel>
                        <FormDescription>
                          Enviar lembretes sobre pagamentos pendentes
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
                  control={form.control}
                  name="notifyCustomers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Notificações de Fatura</FormLabel>
                        <FormDescription>
                          Enviar notificações aos clientes ao emitir novas faturas
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
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            className="gap-2"
          >
            <Save className="h-4 w-4" /> Salvar Alterações
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}