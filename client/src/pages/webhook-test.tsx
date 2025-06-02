import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TestTube } from "lucide-react";

export default function WebhookTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);

  const testWebhook = async () => {
    setIsTesting(true);
    try {
      // Criar um frete de teste para verificar se o webhook é enviado
      const testFreight = {
        clientId: 1, // ID de um cliente existente
        userId: user?.id,
        origin: "São Paulo",
        originState: "SP",
        destination: "Rio de Janeiro",
        destinationState: "RJ",
        vehicleType: "carreta",
        bodyType: "sider",
        cargoType: "completa",
        cargoWeight: "1000",
        freightValue: "5000.00",
        paymentMethod: "pix",
        contactName: "Teste Webhook",
        contactPhone: "(11) 99999-9999",
        observations: "Teste de webhook automático",
        status: "aberto",
        expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        createdAt: new Date()
      };

      const response = await apiRequest('POST', '/api/freights', testFreight);
      
      if (response.ok) {
        const freight = await response.json();
        toast({
          title: "Frete de teste criado",
          description: `Frete #${freight.id} criado. Verifique se o webhook foi enviado.`
        });
      } else {
        throw new Error('Erro ao criar frete de teste');
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível criar o frete de teste",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Verificar se o usuário tem permissão (admin ou embarcador com assinatura)
  const hasPermission = user?.profileType === 'administrador' || 
    user?.profileType === 'admin' ||
    (user?.profileType === 'embarcador' && user?.subscriptionActive) ||
    (user?.profileType === 'shipper' && user?.subscriptionActive);

  if (!hasPermission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Esta funcionalidade está disponível apenas para administradores e embarcadores com assinatura ativa.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-6 w-6" />
            Teste de Webhook
          </CardTitle>
          <CardDescription>
            Crie um frete de teste para verificar se o webhook está funcionando
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Como testar:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Configure a URL do webhook na página de configuração</li>
              <li>2. Ative o envio automático</li>
              <li>3. Clique no botão abaixo para criar um frete de teste</li>
              <li>4. Verifique se a mensagem foi enviada para o Zapier/Make</li>
            </ol>
          </div>

          <Button 
            onClick={testWebhook} 
            disabled={isTesting}
            className="w-full"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isTesting ? 'Criando frete de teste...' : 'Criar Frete de Teste'}
          </Button>

          <div className="text-sm text-muted-foreground">
            <p><strong>Nota:</strong> O frete será criado com dados de teste. Verifique os logs do servidor para confirmar se o webhook foi enviado.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}