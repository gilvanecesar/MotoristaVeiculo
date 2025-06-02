import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Webhook, TestTube, Save, ExternalLink, CheckCircle, MessageCircle, QrCode, Wifi, WifiOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WebhookConfig {
  enabled: boolean;
  url: string;
  groupIds: string[];
  minFreightValue?: number;
  allowedRoutes?: string[];
}

export default function WebhookConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<WebhookConfig>({
    enabled: false,
    url: "",
    groupIds: [],
    minFreightValue: 0,
    allowedRoutes: []
  });
  
  const [groupIdsText, setGroupIdsText] = useState("");
  const [allowedRoutesText, setAllowedRoutesText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Verificar se o usuário tem permissão (admin ou embarcador com assinatura)
  const hasPermission = user?.profileType === 'administrador' || 
    user?.profileType === 'admin' ||
    (user?.profileType === 'embarcador' && user?.subscriptionActive) ||
    (user?.profileType === 'shipper' && user?.subscriptionActive);

  useEffect(() => {
    if (hasPermission) {
      loadConfig();
    }
  }, [hasPermission]);

  const loadConfig = async () => {
    try {
      const response = await apiRequest('GET', '/api/webhook/config');
      const data = await response.json();
      setConfig(data);
      setGroupIdsText(data.groupIds?.join(', ') || '');
      setAllowedRoutesText(data.allowedRoutes?.join(', ') || '');
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a configuração do webhook",
        variant: "destructive"
      });
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const updatedConfig = {
        ...config,
        groupIds: groupIdsText.split(',').map(id => id.trim()).filter(id => id),
        allowedRoutes: allowedRoutesText.split(',').map(route => route.trim()).filter(route => route)
      };

      const response = await apiRequest('POST', '/api/webhook/config', updatedConfig);
      
      if (response.ok) {
        toast({
          title: "Configuração salva",
          description: "As configurações do webhook foram salvas com sucesso"
        });
        await loadConfig();
      } else {
        throw new Error('Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração do webhook",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!config.url) {
      toast({
        title: "URL necessária",
        description: "Configure uma URL antes de testar o webhook",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await apiRequest('POST', '/api/webhook/test');
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Teste realizado",
          description: "Webhook de teste enviado com sucesso"
        });
      } else {
        throw new Error(data.error || 'Erro no teste');
      }
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível enviar o webhook de teste",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Esta funcionalidade está disponível apenas para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Administradores do sistema</li>
              <li>Embarcadores com assinatura ativa</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Webhook className="h-8 w-8" />
          Configuração do WhatsApp
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure o envio automático de fretes para grupos do WhatsApp via Zapier ou Make
        </p>
      </div>

      <div className="grid gap-6">
        {/* Card principal de configuração */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>
              Configure a URL do webhook e ative o envio automático
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Switch para ativar/desativar */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="webhook-enabled">Envio automático ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Quando ativado, fretes serão enviados automaticamente após o cadastro
                </p>
              </div>
              <Switch
                id="webhook-enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            {/* URL do webhook */}
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL do Webhook</Label>
              <Input
                id="webhook-url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={config.url}
                onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground">
                Cole aqui a URL fornecida pelo Zapier ou Make
              </p>
            </div>

            {/* Valor mínimo */}
            <div className="space-y-2">
              <Label htmlFor="min-value">Valor mínimo do frete (R$)</Label>
              <Input
                id="min-value"
                type="number"
                placeholder="0"
                value={config.minFreightValue || ''}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  minFreightValue: e.target.value ? parseFloat(e.target.value) : 0 
                }))}
              />
              <p className="text-sm text-muted-foreground">
                Apenas fretes acima deste valor serão enviados (0 = todos os fretes)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card de configurações avançadas */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Avançadas</CardTitle>
            <CardDescription>
              Configure filtros específicos para o envio automático
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* IDs dos grupos */}
            <div className="space-y-2">
              <Label htmlFor="group-ids">IDs dos Grupos (opcional)</Label>
              <Textarea
                id="group-ids"
                placeholder="grupo1@g.us, grupo2@g.us"
                value={groupIdsText}
                onChange={(e) => setGroupIdsText(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Separe múltiplos IDs por vírgula. Deixe vazio para usar a configuração do Zapier/Make
              </p>
            </div>

            {/* Rotas permitidas */}
            <div className="space-y-2">
              <Label htmlFor="allowed-routes">Rotas Específicas (opcional)</Label>
              <Textarea
                id="allowed-routes"
                placeholder="São Paulo - Rio de Janeiro, Belo Horizonte - Salvador"
                value={allowedRoutesText}
                onChange={(e) => setAllowedRoutesText(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Apenas fretes dessas rotas serão enviados. Deixe vazio para enviar todas as rotas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card de ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Salve as configurações e teste o funcionamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={saveConfig} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={testWebhook} 
                disabled={isTesting || !config.url}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTesting ? 'Testando...' : 'Testar Webhook'}
              </Button>
            </div>

            {config.enabled && config.url && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Webhook ativo</span>
                </div>
                <p className="text-green-700 mt-1">
                  Fretes serão enviados automaticamente após o cadastro
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como Configurar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Zapier (Recomendado)</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Acesse zapier.com e crie uma conta</li>
                <li>• Crie um novo Zap com trigger "Webhooks by Zapier"</li>
                <li>• Escolha "Catch Hook" e copie a URL fornecida</li>
                <li>• Configure a ação para "WhatsApp Business" ou "Formatter"</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Make (ex-Integromat)</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Acesse make.com e crie uma conta</li>
                <li>• Crie um novo cenário com "Custom Webhook"</li>
                <li>• Copie a URL do webhook fornecida</li>
                <li>• Configure a conexão com WhatsApp Business API</li>
              </ul>
            </div>

            <div className="flex items-center gap-2 text-blue-600">
              <ExternalLink className="h-4 w-4" />
              <a 
                href="https://zapier.com/apps/webhooks/integrations/whatsapp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm hover:underline"
              >
                Ver integração Zapier + WhatsApp
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}