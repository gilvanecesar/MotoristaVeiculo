import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Webhook, Settings, TestTube, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface WebhookConfig {
  enabled: boolean;
  url: string;
  groupIds: string[];
  minFreightValue?: number;
  allowedRoutes?: string[];
  useDirectWhatsApp?: boolean;
  whatsappGroups?: string[];
}

interface OpenPixWebhookConfig {
  enabled: boolean;
  whatsappWebhookUrl: string;
  notifyPayments: boolean;
  notifySubscriptions: boolean;
}

export default function AdminWebhooksPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<WebhookConfig>({
    enabled: false,
    url: "",
    groupIds: [],
    minFreightValue: 0,
    allowedRoutes: [],
    useDirectWhatsApp: false,
    whatsappGroups: []
  });
  
  const [openPixConfig, setOpenPixConfig] = useState<OpenPixWebhookConfig>({
    enabled: false,
    whatsappWebhookUrl: '',
    notifyPayments: true,
    notifySubscriptions: true
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingOpenPix, setIsSavingOpenPix] = useState(false);

  useEffect(() => {
    loadConfig();
    loadOpenPixConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await apiRequest("GET", "/api/webhook/config");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a configuração dos webhooks.",
        variant: "destructive",
      });
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await apiRequest("POST", "/api/webhook/config", config);
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configuração salva com sucesso!",
        });
      } else {
        throw new Error("Erro ao salvar configuração");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!config.url) {
      toast({
        title: "Erro",
        description: "Configure uma URL primeiro.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const testData = {
        test: true,
        message: "Teste de webhook do QUERO FRETES",
        timestamp: new Date().toISOString(),
        system: "QUERO FRETES Admin"
      };

      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Webhook testado com sucesso!",
        });
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Erro no teste:", error);
      toast({
        title: "Erro no teste",
        description: `Falha ao testar webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Webhook className="h-8 w-8" />
          Administração de Webhooks
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure e gerencie webhooks globais do sistema
        </p>
      </div>

      <div className="grid gap-6">
        {/* Configuração Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração Geral
            </CardTitle>
            <CardDescription>
              Configure os webhooks para integrações externas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="enabled">Habilitar webhooks</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL do Webhook</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={config.url}
                onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground">
                URL para onde os dados serão enviados (ex: Zapier, Make, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minValue">Valor Mínimo do Frete (R$)</Label>
              <Input
                id="minValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={config.minFreightValue || 0}
                onChange={(e) => setConfig(prev => ({ ...prev, minFreightValue: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-sm text-muted-foreground">
                Apenas fretes acima deste valor serão enviados via webhook
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filtros e Regras */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros e Regras</CardTitle>
            <CardDescription>
              Configure quais fretes devem acionar os webhooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="routes">Rotas Permitidas (opcional)</Label>
              <Textarea
                id="routes"
                placeholder="Digite uma rota por linha&#10;Ex:&#10;São Paulo - Rio de Janeiro&#10;Campinas - Santos"
                value={config.allowedRoutes?.join('\n') || ''}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  allowedRoutes: e.target.value.split('\n').filter(route => route.trim()) 
                }))}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Deixe vazio para enviar todas as rotas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Testes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Testes
            </CardTitle>
            <CardDescription>
              Teste a configuração do webhook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button 
                onClick={testWebhook} 
                disabled={isTesting || !config.url}
                variant="outline"
              >
                {isTesting ? "Testando..." : "Testar Webhook"}
              </Button>
              {!config.url && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Configure uma URL primeiro</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={loadConfig}>
            Cancelar
          </Button>
          <Button onClick={saveConfig} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </div>
      </div>
    </div>
  );
}