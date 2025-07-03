import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, QrCode, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WhatsAppStatus {
  isReady: boolean;
  isConnecting: boolean;
  status: string;
  qrCode: string;
}

export default function AdminWhatsAppPage() {
  const { toast } = useToast();
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>({
    isReady: false,
    isConnecting: false,
    status: 'disconnected',
    qrCode: ''
  });
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do sistema QUERO FRETES 🚛");
  const [testNumber, setTestNumber] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWhatsAppStatus();
    const interval = setInterval(loadWhatsAppStatus, 3000); // Atualiza a cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  const loadWhatsAppStatus = async () => {
    try {
      const response = await apiRequest("GET", "/api/whatsapp/status");
      const data = await response.json();
      setWhatsappStatus(data);
    } catch (error) {
      console.error("Erro ao carregar status do WhatsApp:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWhatsApp = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/whatsapp/connect");
      toast({
        title: "Conectando...",
        description: "Iniciando conexão com WhatsApp. Aguarde o QR Code aparecer.",
      });
      // Status será atualizado automaticamente pelo intervalo
    } catch (error) {
      console.error("Erro ao conectar WhatsApp:", error);
      toast({
        title: "Erro",
        description: "Não foi possível conectar ao WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/whatsapp/disconnect");
      toast({
        title: "Desconectado",
        description: "WhatsApp foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao desconectar WhatsApp:", error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar o WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testNumber.trim()) {
      toast({
        title: "Erro",
        description: "Digite um número de WhatsApp para teste.",
        variant: "destructive",
      });
      return;
    }

    if (!testMessage.trim()) {
      toast({
        title: "Erro", 
        description: "Digite uma mensagem para teste.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsTesting(true);
      
      // Formatar número para teste
      const cleanNumber = testNumber.replace(/\D/g, '');
      const chatId = cleanNumber.startsWith('55') ? `${cleanNumber}@c.us` : `55${cleanNumber}@c.us`;

      await apiRequest("POST", "/api/whatsapp/test", {
        groupId: chatId,
        message: testMessage
      });

      toast({
        title: "Teste enviado!",
        description: `Mensagem enviada para ${testNumber}`,
      });
    } catch (error) {
      console.error("Erro ao enviar teste:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem de teste.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    switch (whatsappStatus.status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Conectando</Badge>;
      case 'qr_ready':
        return <Badge className="bg-blue-500"><QrCode className="h-3 w-3 mr-1" />Aguardando QR</Badge>;
      case 'auth_failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falha na autenticação</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Desconectado</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-8 w-8" />
          Gestão WhatsApp
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure e gerencie as mensagens automáticas do WhatsApp
        </p>
      </div>

      <div className="grid gap-6">
        {/* Status da Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Status da Conexão</span>
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>
              Estado atual da conexão com o WhatsApp Web
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-sm text-muted-foreground">
                  {whatsappStatus.status === 'connected' && "WhatsApp conectado e pronto para uso"}
                  {whatsappStatus.status === 'connecting' && "Estabelecendo conexão..."}
                  {whatsappStatus.status === 'qr_ready' && "QR Code gerado, escaneie no seu WhatsApp"}
                  {whatsappStatus.status === 'disconnected' && "WhatsApp não está conectado"}
                  {whatsappStatus.status === 'auth_failed' && "Falha na autenticação, tente reconectar"}
                  {whatsappStatus.status === 'error' && "Erro na conexão, verifique a configuração"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Funcionalidade</Label>
                <p className="text-sm text-muted-foreground">
                  {whatsappStatus.isReady 
                    ? "✅ Mensagens automáticas ativas para novos cadastros"
                    : "❌ Mensagens automáticas desabilitadas"
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!whatsappStatus.isReady ? (
                <Button 
                  onClick={connectWhatsApp} 
                  disabled={isLoading || whatsappStatus.isConnecting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading || whatsappStatus.isConnecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4 mr-2" />
                  )}
                  Conectar WhatsApp
                </Button>
              ) : (
                <Button 
                  onClick={disconnectWhatsApp}
                  variant="destructive"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Desconectar
                </Button>
              )}
              <Button 
                onClick={loadWhatsAppStatus}
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  "Atualizar Status"
                )}
              </Button>
            </div>

            {/* QR Code */}
            {whatsappStatus.qrCode && (
              <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="h-4 w-4" />
                  <Label>Escaneie o QR Code no seu WhatsApp</Label>
                </div>
                <div className="flex justify-center">
                  <img 
                    src={whatsappStatus.qrCode} 
                    alt="QR Code WhatsApp" 
                    className="max-w-xs rounded-lg"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Abra o WhatsApp no seu celular → Mais opções → Dispositivos conectados → Conectar dispositivo
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teste de Mensagem */}
        <Card>
          <CardHeader>
            <CardTitle>Teste de Mensagem</CardTitle>
            <CardDescription>
              Envie uma mensagem de teste para verificar se o WhatsApp está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="test-number">Número de WhatsApp (com DDD)</Label>
                <Input
                  id="test-number"
                  placeholder="(31) 99999-9999"
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  disabled={!whatsappStatus.isReady}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Digite apenas números com DDD (código do país +55 será adicionado automaticamente)
                </p>
              </div>
              <div>
                <Label htmlFor="test-message">Mensagem de Teste</Label>
                <Textarea
                  id="test-message"
                  placeholder="Digite sua mensagem de teste..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  disabled={!whatsappStatus.isReady}
                  rows={3}
                />
              </div>
            </div>

            <Button 
              onClick={sendTestMessage}
              disabled={!whatsappStatus.isReady || isTesting}
              className="w-full"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              Enviar Teste
            </Button>
          </CardContent>
        </Card>

        {/* Informações sobre Mensagens Automáticas */}
        <Card>
          <CardHeader>
            <CardTitle>Mensagens Automáticas de Boas-vindas</CardTitle>
            <CardDescription>
              Como funciona o envio automático para novos usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Sistema Automático Ativo</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Quando o WhatsApp está conectado, todos os novos usuários que se cadastram no sistema 
                    recebem automaticamente uma mensagem de boas-vindas personalizada.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <Label className="font-medium">Para Motoristas:</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  • Mensagem informando que o acesso está liberado<br/>
                  • Orientações sobre próximos passos (cadastrar veículos, explorar fretes)<br/>
                  • Informações de suporte
                </p>
              </div>
              <div>
                <Label className="font-medium">Para Embarcadores/Agenciadores:</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  • Mensagem sobre ativação de assinatura (R$ 49,90/mês)<br/>
                  • Orientações sobre pagamento via PIX<br/>
                  • Próximos passos após ativação<br/>
                  • Informações de suporte
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Requisitos</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    • WhatsApp deve estar conectado e ativo<br/>
                    • Usuário deve ter número de WhatsApp cadastrado<br/>
                    • Número deve ser válido e aceitar mensagens
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}