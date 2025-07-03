import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Settings } from 'lucide-react';

export default function WebhookConfig() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar webhooks configurados
  const { data: webhooks, isLoading: loadingWebhooks } = useQuery({
    queryKey: ['/api/openpix/webhooks'],
    queryFn: () => apiRequest('GET', '/api/openpix/webhooks').then(res => res.json()),
  });

  // Configurar webhook
  const configureWebhook = useMutation({
    mutationFn: (url: string) => 
      apiRequest('POST', '/api/openpix/configure-webhook', { webhookUrl: url }),
    onSuccess: () => {
      toast({
        title: "Webhook configurado com sucesso",
        description: "O webhook foi configurado na OpenPix",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/openpix/webhooks'] });
      setWebhookUrl('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao configurar webhook",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Configurar chave API
  const configureApiKey = useMutation({
    mutationFn: (key: string) => 
      apiRequest('POST', '/api/openpix/configure-api-key', { apiKey: key }),
    onSuccess: () => {
      toast({
        title: "Chave API configurada com sucesso",
        description: "A nova chave API da OpenPix foi salva",
      });
      setApiKey('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao configurar chave API",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleConfigureWebhook = () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Por favor, insira a URL do webhook",
        variant: "destructive",
      });
      return;
    }
    configureWebhook.mutate(webhookUrl);
  };

  // URLs sugeridas baseadas no ambiente
  const currentDomain = window.location.origin;
  const suggestedUrls = [
    `${currentDomain}/api/webhook/openpix`,
    'https://webhook.querofretes.com.br/api/webhook/openpix',
    'https://webhook.querofretes.com.br/webhook/openpix'
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Configuração de Webhook OpenPix</h1>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            Como configurar o webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>1. Problema identificado:</strong> OpenPix está enviando webhooks para webhook.querofretes.com.br, mas nossa aplicação está em {currentDomain}</p>
            <p><strong>2. Solução:</strong> Configurar o webhook para apontar para o domínio correto</p>
            <p><strong>3. Opções:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Usar a função abaixo para configurar via API</li>
              <li>Ou configurar manualmente no painel OpenPix</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* URLs sugeridas */}
      <Card>
        <CardHeader>
          <CardTitle>URLs Sugeridas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {suggestedUrls.map((url, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <code className="flex-1 text-sm">{url}</code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setWebhookUrl(url)}
                >
                  Usar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurar chave API */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Chave API OpenPix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="api-key">Nova Chave API</Label>
            <Input
              id="api-key"
              placeholder="Cole aqui a chave API da OpenPix"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Cole aqui a nova chave API fornecida pela OpenPix
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Exemplo: Q2xpZW50X0lkX2E4MDg5OGI1LWVkNzgtNDA5Mi1iNjRhLTFhMmIzZjBkMTc2MzpDbGllbnRfU2VjcmV0X3JHU1pGdWFiZXZ3SVlDcWt1dnNYV05SVHFTNmsvUUxpbzZ2enZMOFVFa3M9
            </p>
          </div>
          
          <Button 
            onClick={() => configureApiKey.mutate(apiKey)}
            disabled={configureApiKey.isPending || !apiKey.trim()}
            className="w-full"
          >
            {configureApiKey.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Atualizar Chave API
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Configurar webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Webhook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook-url">URL do Webhook</Label>
            <Input
              id="webhook-url"
              placeholder="https://exemplo.com/api/webhook/openpix"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleConfigureWebhook}
            disabled={configureWebhook.isPending}
            className="w-full"
          >
            {configureWebhook.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Configurar Webhook
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Webhooks atuais */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWebhooks ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Carregando webhooks...</span>
            </div>
          ) : webhooks?.webhooks?.length > 0 ? (
            <div className="space-y-3">
              {webhooks.webhooks.map((webhook: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {webhook.url}
                        </code>
                        <Badge variant={webhook.isActive ? "default" : "secondary"}>
                          {webhook.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={webhook.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Nenhum webhook configurado ou erro ao carregar
            </p>
          )}
        </CardContent>
      </Card>

      {/* Configuração manual */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração Manual (Alternativa)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Caso a configuração automática não funcione:</strong></p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Acesse o painel administrativo da OpenPix</li>
              <li>Vá para a seção de Webhooks</li>
              <li>Configure a URL para: <code className="bg-gray-100 px-1 rounded">{currentDomain}/api/webhook/openpix</code></li>
              <li>Salve as alterações</li>
            </ol>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Importante:</strong> Após configurar, teste fazendo um pagamento PIX para verificar se os webhooks estão sendo recebidos corretamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}