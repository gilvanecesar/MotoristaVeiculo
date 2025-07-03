import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Link2, Settings, Webhook, CheckCircle, XCircle, TestTube } from "lucide-react";

const n8nConfigSchema = z.object({
  webhookUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

type N8nConfigData = z.infer<typeof n8nConfigSchema>;

export default function N8nConfig() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  const form = useForm<N8nConfigData>({
    resolver: zodResolver(n8nConfigSchema),
    defaultValues: {
      webhookUrl: "",
    },
  });

  // Buscar configuração atual
  const { data: config, refetch } = useQuery({
    queryKey: ["/api/admin/n8n/config"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/n8n/config");
      return response.json();
    },
  });

  // Atualizar form quando config carrega
  useState(() => {
    if (config) {
      form.setValue("webhookUrl", config.webhookUrl || "");
    }
  });

  const onSubmit = async (data: N8nConfigData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/n8n/config", data);
      
      if (response.ok) {
        toast({
          title: "Configuração Salva",
          description: "URL do webhook N8N configurada com sucesso!",
        });
        refetch();
      } else {
        throw new Error("Falha ao salvar configuração");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    try {
      const response = await apiRequest("POST", "/api/admin/n8n/test", {
        testData: { 
          message: "Teste do webhook N8N",
          timestamp: new Date().toISOString(),
          user: "Teste administrativo"
        }
      });
      
      if (response.ok) {
        toast({
          title: "Teste Enviado",
          description: "Dados de teste enviados para o N8N com sucesso!",
        });
      } else {
        throw new Error("Falha no teste");
      }
    } catch (error) {
      toast({
        title: "Erro no Teste",
        description: "Não foi possível enviar dados de teste para o N8N",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configuração N8N</h1>
        <p className="text-gray-600">
          Configure a integração com N8N para automação de processos
        </p>
      </div>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status da Integração
            </CardTitle>
            <CardDescription>
              Status atual da conexão com N8N
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {config?.webhookUrl ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge className="bg-green-100 text-green-800">
                    Configurado
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <Badge variant="destructive">
                    Não Configurado
                  </Badge>
                </div>
              )}
              
              {config?.webhookUrl && (
                <Button
                  onClick={handleTestWebhook}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  Testar Webhook
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook N8N
            </CardTitle>
            <CardDescription>
              Configure a URL do webhook N8N para receber dados de novos cadastros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="webhookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Webhook N8N</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://n8n.exemplo.com/webhook/user-registration"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Salvar Configuração"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  📤 Envio Automático
                </h3>
                <p className="text-sm text-blue-800">
                  Quando um usuário se cadastra no sistema, seus dados são automaticamente 
                  enviados para o N8N através do webhook configurado.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">
                  🔄 Dados Enviados
                </h3>
                <p className="text-sm text-green-800">
                  Nome, email, WhatsApp, tipo de perfil, CPF/CNPJ, dados de veículo 
                  e timestamp são enviados no formato JSON.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">
                  ⚙️ Configuração N8N
                </h3>
                <p className="text-sm text-purple-800">
                  Configure um workflow no N8N que processe esses dados e execute 
                  ações como envio de WhatsApp, emails ou integração com outros sistemas.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Estrutura do Payload:</h4>
              <Textarea
                readOnly
                value={JSON.stringify({
                  event: "user_registered",
                  timestamp: "2025-01-01T00:00:00.000Z",
                  user: {
                    id: 123,
                    name: "João Silva",
                    email: "joao@exemplo.com",
                    whatsapp: "11999999999",
                    profileType: "embarcador",
                    cpf: "123.456.789-00",
                    cnpj: "12.345.678/0001-90"
                  },
                  system: {
                    source: "QUERO_FRETES",
                    environment: "production"
                  }
                }, null, 2)}
                className="font-mono text-sm h-48"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}