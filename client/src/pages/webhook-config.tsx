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
  useDirectWhatsApp?: boolean;
  whatsappGroups?: string[];
}

export default function WebhookConfig() {
  const { user } = useAuth();
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
  
  const [groupIdsText, setGroupIdsText] = useState("");
  const [allowedRoutesText, setAllowedRoutesText] = useState("");
  const [whatsappGroupsText, setWhatsappGroupsText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');

  // Verificar se o usuário tem permissão (admin ou usuários com assinatura ativa)
  const hasPermission = user?.profileType === 'administrador' || 
    user?.profileType === 'admin' ||
    (user?.subscriptionActive && (
      user?.profileType === 'embarcador' || 
      user?.profileType === 'shipper' ||
      user?.profileType === 'agenciador' ||
      user?.profileType === 'transportador' ||
      user?.profileType === 'agent'
    ));

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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8" />
          WhatsApp Config
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Configure automatic freight posting to WhatsApp groups
        </p>
      </div>

      <Tabs defaultValue="webhook" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="webhook" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            <span className="hidden sm:inline">Zapier/Make</span>
            <span className="sm:hidden">Webhook</span>
          </TabsTrigger>
          <TabsTrigger value="direct" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Direct WhatsApp</span>
            <span className="sm:hidden">Direct</span>
          </TabsTrigger>
        </TabsList>

        {/* Webhook Integration Tab */}
        <TabsContent value="webhook" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Configure automatic freight posting via Zapier or Make
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Switch para ativar/desativar */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="webhook-enabled">Enable automatic posting</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, freights will be sent automatically after registration
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
        </TabsContent>

        {/* Direct WhatsApp Tab */}
        <TabsContent value="direct" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Direct WhatsApp Integration
              </CardTitle>
              <CardDescription>
                Connect directly to WhatsApp Web for automatic message sending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start gap-3">
                  <QrCode className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Coming Soon</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Direct WhatsApp integration will be available in the next version. 
                      For now, please use the Webhook + Zapier/Make option.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Direct WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable direct WhatsApp Web integration
                    </p>
                  </div>
                  <Switch
                    checked={config.useDirectWhatsApp}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, useDirectWhatsApp: checked }))}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp-groups">WhatsApp Group IDs</Label>
                  <Textarea
                    id="whatsapp-groups"
                    placeholder="Group ID 1, Group ID 2, Group ID 3..."
                    value={whatsappGroupsText}
                    onChange={(e) => setWhatsappGroupsText(e.target.value)}
                    disabled
                    className="min-h-[80px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Separate multiple group IDs with commas
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Status: Not Connected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={saveConfig} 
          disabled={isSaving}
          className="flex-1 sm:flex-none"
        >
          {isSaving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={testWebhook} 
          disabled={isTesting || !config.url}
          className="flex-1 sm:flex-none"
        >
          {isTesting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Test Webhook
            </>
          )}
        </Button>
      </div>
    </div>
  );
}