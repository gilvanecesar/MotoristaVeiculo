import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Users, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone,
  Smartphone,
  Wifi,
  WifiOff,
  QrCode
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface WhatsAppStatus {
  isReady: boolean;
  isConnecting: boolean;
  status: string;
  qrCode: string;
}

interface BroadcastResult {
  clientId: number;
  clientName: string;
  phone?: string;
  success: boolean;
  error?: string;
}

interface BroadcastResponse {
  success: boolean;
  message: string;
  summary: {
    totalClients: number;
    successCount: number;
    errorCount: number;
  };
  results: BroadcastResult[];
}

export default function WhatsAppBroadcastPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [broadcastResults, setBroadcastResults] = useState<BroadcastResponse | null>(null);

  // Buscar status do WhatsApp
  const { data: whatsappStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/whatsapp/status");
      return await res.json();
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  // Buscar clientes para mostrar quantos serão impactados
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      return await res.json();
    }
  });

  // Mutação para conectar WhatsApp
  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/whatsapp/connect");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "WhatsApp conectando",
        description: "Iniciando conexão com WhatsApp...",
      });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao conectar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para desconectar WhatsApp
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/whatsapp/disconnect");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "WhatsApp desconectado",
        description: "Conexão com WhatsApp foi encerrada.",
      });
      refetchStatus();
    }
  });

  // Mutação para enviar mensagem broadcast
  const broadcastMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await apiRequest("POST", "/api/whatsapp/broadcast", {
        message: messageText
      });
      return await res.json();
    },
    onSuccess: (data: BroadcastResponse) => {
      setBroadcastResults(data);
      toast({
        title: "Envio concluído",
        description: data.message,
      });
      setMessage(""); // Limpar mensagem após envio
    },
    onError: (error: any) => {
      toast({
        title: "Erro no envio",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSendBroadcast = () => {
    if (!message.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Por favor, digite uma mensagem para enviar.",
        variant: "destructive",
      });
      return;
    }

    if (!whatsappStatus?.isReady) {
      toast({
        title: "WhatsApp não conectado",
        description: "Conecte o WhatsApp antes de enviar mensagens.",
        variant: "destructive",
      });
      return;
    }

    broadcastMutation.mutate(message);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'qr_ready': return 'bg-blue-500';
      case 'disconnected': return 'bg-gray-500';
      default: return 'bg-red-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'qr_ready': return 'QR Code pronto';
      case 'disconnected': return 'Desconectado';
      case 'authenticated': return 'Autenticado';
      case 'auth_failed': return 'Falha na autenticação';
      default: return 'Status desconhecido';
    }
  };

  const clientsWithPhone = clients.filter(client => client.whatsapp || client.phone);

  return (
    <div className="container px-3 sm:px-4 lg:px-6 py-6 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mensagens WhatsApp</h1>
          <p className="text-slate-600">Envie mensagens para todos os clientes cadastrados</p>
        </div>
        <FaWhatsapp className="h-8 w-8 text-green-600" />
      </div>

      {/* Status do WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {whatsappStatus?.isReady ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
            Status da Conexão WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(whatsappStatus?.status || 'disconnected')}`} />
              <span className="font-medium">{getStatusText(whatsappStatus?.status || 'disconnected')}</span>
            </div>
            <div className="flex gap-2">
              {!whatsappStatus?.isReady && !whatsappStatus?.isConnecting && (
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  size="sm"
                >
                  {connectMutation.isPending ? "Conectando..." : "Conectar"}
                </Button>
              )}
              {whatsappStatus?.isReady && (
                <Button
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  Desconectar
                </Button>
              )}
            </div>
          </div>

          {/* QR Code */}
          {whatsappStatus?.qrCode && (
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

      {/* Informações dos Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
              <div className="text-sm text-blue-600">Total de Clientes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{clientsWithPhone.length}</div>
              <div className="text-sm text-green-600">Com WhatsApp/Telefone</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{clients.length - clientsWithPhone.length}</div>
              <div className="text-sm text-orange-600">Sem Contato</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Envio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enviar Mensagem
          </CardTitle>
          <CardDescription>
            A mensagem será personalizada com o nome de cada cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem aqui..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              A mensagem será enviada como: "Olá, [Nome do Cliente]! [Sua mensagem]"
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-slate-600">
              {clientsWithPhone.length} clientes receberão a mensagem
            </div>
            <Button
              onClick={handleSendBroadcast}
              disabled={!whatsappStatus?.isReady || !message.trim() || broadcastMutation.isPending}
              className="flex items-center gap-2"
            >
              {broadcastMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar para Todos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados do Envio */}
      {broadcastResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resultados do Envio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{broadcastResults.summary.totalClients}</div>
                <div className="text-sm text-blue-600">Total Processados</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">{broadcastResults.summary.successCount}</div>
                <div className="text-sm text-green-600">Enviados com Sucesso</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">{broadcastResults.summary.errorCount}</div>
                <div className="text-sm text-red-600">Erros de Envio</div>
              </div>
            </div>

            <Separator />

            {/* Detalhes */}
            <div className="space-y-2">
              <Label>Detalhes por Cliente</Label>
              <ScrollArea className="h-64 w-full border rounded-md p-4">
                <div className="space-y-2">
                  {broadcastResults.results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      } border`}
                    >
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium text-sm">{result.clientName}</div>
                          {result.phone && (
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {result.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        {result.success ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Enviado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Erro
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aviso importante */}
      <Alert>
        <AlertDescription>
          <strong>Importante:</strong> O WhatsApp possui limites de envio para evitar spam. 
          Recomendamos usar esta funcionalidade com moderação e apenas para comunicações importantes.
        </AlertDescription>
      </Alert>
    </div>
  );
}