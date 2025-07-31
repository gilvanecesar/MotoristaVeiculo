import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, Send, MessageCircle, Loader2, AlertCircle, User, Trash2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils/format";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface MessageLimits {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Buscar histórico de mensagens
  const { data: chatHistory = [], isLoading } = useQuery({
    queryKey: ["/api/ai-assistant/history"],
    enabled: !!user,
  });

  // Buscar limites de mensagem
  const { data: limits } = useQuery<MessageLimits>({
    queryKey: ["/api/ai-assistant/limits"],
    enabled: !!user,
  });

  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/ai-assistant/message", {
        message: content
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao enviar mensagem');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant/limits"] });
      toast({
        title: "Mensagem enviada",
        description: `${data.remaining} mensagens restantes hoje`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Limpar histórico
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/ai-assistant/history");
      if (!res.ok) throw new Error('Erro ao limpar histórico');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant/history"] });
      toast({
        title: "Histórico limpo",
        description: "Todas as mensagens foram removidas",
      });
    }
  });

  // Scroll para baixo quando novas mensagens chegam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    if (!limits?.allowed) {
      toast({
        title: "Limite atingido",
        description: `Você já usou suas ${limits?.limit} mensagens diárias`,
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate(message.trim());
  };

  const getUserTypeLabel = () => {
    if (!user) return "";
    
    switch (user.profileType) {
      case "motorista":
      case "driver":
        return "Motorista";
      case "embarcador":
      case "shipper":
        return "Embarcador";
      case "transportador":
      case "carrier":
        return "Transportador";
      case "agenciador":
      case "agent":
        return "Agenciador";
      case "administrador":
      case "admin":
        return "Administrador";
      default:
        return user.profileType;
    }
  };

  const getLimitColor = () => {
    if (!limits) return "gray";
    const percentage = (limits.remaining / limits.limit) * 100;
    if (percentage > 50) return "green";
    if (percentage > 20) return "yellow";
    return "red";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Assistente IA de Transporte</h1>
              <p className="text-muted-foreground">
                Especialista em regulamentações, fretes e logística
              </p>
            </div>
          </div>
          
          {/* Limites de uso */}
          {limits && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-2">
                <Zap className="h-3 w-3" />
                {limits.remaining}/{limits.limit} mensagens hoje
              </Badge>
              <Badge variant="secondary">
                {getUserTypeLabel()}
              </Badge>
            </div>
          )}
        </div>

        {/* Informações sobre o assistente */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Especialidades:</strong> Regulamentações ANTT, CNH, RNTRC, CTe, MDFe, cálculos de frete, 
            tipos de veículos, legislação trabalhista para motoristas, segurança no transporte e otimização de rotas.
          </AlertDescription>
        </Alert>

        {/* Chat Interface */}
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversa
              </CardTitle>
              <CardDescription>
                Faça suas perguntas sobre transporte de cargas
              </CardDescription>
            </div>
            
            {chatHistory.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Mensagens */}
            <ScrollArea className="h-96 px-6">
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Olá! Como posso ajudar?</h3>
                  <p className="text-muted-foreground max-w-md">
                    Sou especialista em transporte de cargas no Brasil. 
                    Pergunte sobre regulamentações, documentação, cálculos ou qualquer dúvida da área.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {chatHistory.map((msg: ChatMessage, index: number) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDate(new Date(msg.timestamp))}
                        </p>
                      </div>
                      
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {sendMessageMutation.isPending && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Pensando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            <Separator />
            
            {/* Input de mensagem */}
            <div className="p-6">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua pergunta sobre transporte..."
                  disabled={sendMessageMutation.isPending || !limits?.allowed}
                  className="flex-1"
                  maxLength={500}
                />
                <Button
                  type="submit"
                  disabled={!message.trim() || sendMessageMutation.isPending || !limits?.allowed}
                  size="icon"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              
              {limits && !limits.allowed && (
                <Alert className="mt-3" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Limite diário de {limits.limit} mensagens atingido. 
                    {user?.profileType === 'driver' || user?.profileType === 'motorista' 
                      ? " Assine o plano mensal para ter acesso a 50 mensagens por dia."
                      : " O limite será resetado amanhã."
                    }
                  </AlertDescription>
                </Alert>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                {message.length}/500 caracteres • Pressione Enter para enviar
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}