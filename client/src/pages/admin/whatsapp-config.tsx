import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Smartphone, Users, Settings, Wifi, WifiOff } from "lucide-react";

interface WhatsAppStatus {
  status: string;
  isReady: boolean;
  qrCode?: string;
}

export default function WhatsAppConfig() {
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do sistema QUERO FRETES.");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar o status do WhatsApp
  const { data: whatsappStatus, isLoading: statusLoading } = useQuery<WhatsAppStatus>({
    queryKey: ['/api/whatsapp/status'],
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  // Mutation para conectar WhatsApp
  const connectMutation = useMutation({
    mutationFn: () => apiRequest('/api/whatsapp/connect', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "Conectando WhatsApp",
        description: "Iniciando processo de conexão...",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao conectar",
        description: error.message || "Erro ao conectar com WhatsApp",
        variant: "destructive",
      });
    },
  });

  // Mutation para desconectar WhatsApp
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('/api/whatsapp/disconnect', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "WhatsApp desconectado",
        description: "Conexão encerrada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao desconectar",
        description: error.message || "Erro ao desconectar WhatsApp",
        variant: "destructive",
      });
    },
  });

  // Mutation para enviar mensagem de teste
  const testMutation = useMutation({
    mutationFn: (data: { number: string; message: string }) => 
      apiRequest('/api/whatsapp/test', { 
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Mensagem enviada",
        description: "Mensagem de teste enviada com sucesso!",
      });
      setTestNumber("");
      setTestMessage("Olá! Esta é uma mensagem de teste do sistema QUERO FRETES.");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Erro ao enviar mensagem de teste",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const handleTestMessage = () => {
    if (!testNumber.trim()) {
      toast({
        title: "Número obrigatório",
        description: "Por favor, insira um número para teste",
        variant: "destructive",
      });
      return;
    }

    if (!testMessage.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Por favor, insira uma mensagem para teste",
        variant: "destructive",
      });
      return;
    }

    testMutation.mutate({
      number: testNumber,
      message: testMessage,
    });
  };

  const getStatusBadge = () => {
    if (statusLoading) return <Badge variant="secondary">Carregando...</Badge>;
    if (!whatsappStatus) return <Badge variant="destructive">Desconectado</Badge>;
    
    switch (whatsappStatus.status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500"><Wifi className="w-3 h-3 mr-1" />Conectado</Badge>;
      case 'connecting':
        return <Badge variant="secondary"><Smartphone className="w-3 h-3 mr-1" />Conectando...</Badge>;
      case 'disconnected':
        return <Badge variant="destructive"><WifiOff className="w-3 h-3 mr-1" />Desconectado</Badge>;
      default:
        return <Badge variant="outline">{whatsappStatus.status}</Badge>;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="w-8 h-8" />
            Configuração do WhatsApp
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure e gerencie a integração do WhatsApp com o sistema
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status e Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Status da Conexão
            </CardTitle>
            <CardDescription>
              Gerencie a conexão com o WhatsApp Web
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status atual:</span>
              {getStatusBadge()}
            </div>
            
            <Separator />

            <div className="flex gap-2">
              <Button 
                onClick={handleConnect}
                disabled={connectMutation.isPending || whatsappStatus?.status === 'connected'}
                className="flex-1"
              >
                {connectMutation.isPending ? "Conectando..." : "Conectar"}
              </Button>
              <Button 
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending || whatsappStatus?.status === 'disconnected'}
                variant="outline"
                className="flex-1"
              >
                {disconnectMutation.isPending ? "Desconectando..." : "Desconectar"}
              </Button>
            </div>

            {whatsappStatus?.qrCode && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Escaneie o QR Code com seu WhatsApp:
                </p>
                <img 
                  src={whatsappStatus.qrCode} 
                  alt="QR Code WhatsApp" 
                  className="mx-auto max-w-48 border rounded"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teste de Mensagem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Teste de Mensagem
            </CardTitle>
            <CardDescription>
              Envie uma mensagem de teste para verificar se está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testNumber">Número de teste (com código do país)</Label>
              <Input
                id="testNumber"
                type="text"
                placeholder="5531999999999"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Exemplo: 5531999999999 (Brasil)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testMessage">Mensagem de teste</Label>
              <Input
                id="testMessage"
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleTestMessage}
              disabled={testMutation.isPending || whatsappStatus?.status !== 'connected'}
              className="w-full"
            >
              {testMutation.isPending ? "Enviando..." : "Enviar Teste"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Funcionalidades Disponíveis:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Envio automático de mensagens de boas-vindas</li>
                <li>• Notificações de pagamentos e assinaturas</li>
                <li>• Broadcast de fretes para grupos</li>
                <li>• Mensagens de teste e suporte</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Requisitos:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• WhatsApp Web ativo no navegador</li>
                <li>• Conexão estável com internet</li>
                <li>• Número de telefone válido</li>
                <li>• Permissões de administrador no sistema</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}