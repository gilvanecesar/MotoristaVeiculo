import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Settings, Send, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface EmailStatus {
  configured: boolean;
  service: string;
  user: string;
  connection: {
    success: boolean;
    message: string;
    service?: string;
  };
}

export default function EmailAdminPage() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  
  // Estados para configuração de email
  const [emailConfig, setEmailConfig] = useState({
    service: "",
    user: "",
    password: "",
    host: "",
    port: "587",
    secure: false,
    requireTLS: true,
    connectionTimeout: "60000",
    greetingTimeout: "30000",
    socketTimeout: "60000"
  });
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Buscar variáveis de ambiente
  const { data: envVars } = useQuery<{
    EMAIL_SERVICE: string;
    EMAIL_USER: string;
    EMAIL_PASSWORD: string;
  }>({
    queryKey: ["/api/admin/email/env"],
  });

  // Buscar status do email
  const { data: emailStatus, isLoading, refetch } = useQuery<EmailStatus>({
    queryKey: ["/api/admin/email/status"],
  });

  // Log para debug
  console.log("Renderizando EmailAdminPage", { testEmail, isTestingEmail, emailStatus });

  // Mutation para enviar email de teste
  const sendTestEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/admin/email/test", { email });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Teste realizado",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no teste",
        description: error.message || "Falha ao enviar email de teste",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar configuração de email
  const updateConfigMutation = useMutation({
    mutationFn: async (config: { service: string; user: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/email/config", config);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Configuração atualizada",
        description: "As configurações de email foram salvas com sucesso",
        variant: "default",
      });
      refetch(); // Recarregar status
      setEmailConfig(prev => ({ ...prev, password: "" })); // Limpar apenas senha por segurança
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Falha ao atualizar configurações",
        variant: "destructive",
      });
    },
  });

  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido",
        variant: "destructive",
      });
      return;
    }

    setIsTestingEmail(true);
    try {
      await sendTestEmailMutation.mutateAsync(testEmail);
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!emailConfig.service || !emailConfig.user || !emailConfig.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingConfig(true);
    try {
      await updateConfigMutation.mutateAsync(emailConfig);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  console.log("EmailAdminPage - emailStatus:", emailStatus);
  console.log("EmailAdminPage - testEmail:", testEmail);
  console.log("EmailAdminPage - isTestingEmail:", isTestingEmail);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuração de Email
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as configurações do serviço de envio de emails do sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Configurações Completas de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Configurações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configurações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Serviço de Email:</label>
                  <select
                    value={emailConfig.service}
                    onChange={(e) => {
                      const service = e.target.value;
                      let newConfig = { ...emailConfig, service };
                      
                      // Auto-configurar host e porta baseado no serviço
                      switch (service) {
                        case 'gmail':
                          newConfig = { ...newConfig, host: 'smtp.gmail.com', port: '587', secure: false };
                          break;
                        case 'outlook':
                          newConfig = { ...newConfig, host: 'smtp-mail.outlook.com', port: '587', secure: false };
                          break;
                        case 'yahoo':
                          newConfig = { ...newConfig, host: 'smtp.mail.yahoo.com', port: '587', secure: false };
                          break;
                        case 'hostinger':
                          newConfig = { ...newConfig, host: 'smtp.hostinger.com', port: '587', secure: false };
                          break;
                        case 'sendgrid':
                          newConfig = { ...newConfig, host: 'smtp.sendgrid.net', port: '587', secure: false };
                          break;
                        default:
                          newConfig = { ...newConfig, host: '', port: '587', secure: false };
                      }
                      
                      setEmailConfig(newConfig);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Serviço Personalizado</option>
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook</option>
                    <option value="yahoo">Yahoo</option>
                    <option value="hostinger">Hostinger</option>
                    <option value="sendgrid">SendGrid</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email:</label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={emailConfig.user}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, user: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Senha:</label>
                  <input
                    type="password"
                    placeholder="Para Gmail, use senha de aplicativo"
                    value={emailConfig.password}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Configurações SMTP */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Configurações SMTP</h3>
                <button
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showAdvancedSettings ? 'Ocultar' : 'Mostrar'} Avançadas
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Host SMTP:</label>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={emailConfig.host}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, host: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Porta:</label>
                  <select
                    value={emailConfig.port}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, port: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="25">25 (SMTP padrão)</option>
                    <option value="587">587 (STARTTLS)</option>
                    <option value="465">465 (SSL/TLS)</option>
                    <option value="2525">2525 (Alternativo)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Segurança:</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={emailConfig.secure}
                        onChange={(e) => setEmailConfig(prev => ({ ...prev, secure: e.target.checked }))}
                        className="mr-2"
                      />
                      SSL/TLS
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={emailConfig.requireTLS}
                        onChange={(e) => setEmailConfig(prev => ({ ...prev, requireTLS: e.target.checked }))}
                        className="mr-2"
                      />
                      Require TLS
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações Avançadas */}
            {showAdvancedSettings && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Configurações Avançadas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timeout de Conexão (ms):</label>
                    <input
                      type="number"
                      value={emailConfig.connectionTimeout}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, connectionTimeout: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timeout de Greeting (ms):</label>
                    <input
                      type="number"
                      value={emailConfig.greetingTimeout}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, greetingTimeout: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timeout de Socket (ms):</label>
                    <input
                      type="number"
                      value={emailConfig.socketTimeout}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, socketTimeout: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleUpdateConfig}
              disabled={isUpdatingConfig || !emailConfig.user || !emailConfig.password}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUpdatingConfig ? "Salvando..." : "Salvar Configuração"}
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Dicas de Configuração:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Para Gmail: Use porta 587 com STARTTLS e senha de aplicativo</li>
                    <li>Para Outlook: Use porta 587 com STARTTLS</li>
                    <li>Para serviços SSL: Use porta 465 com SSL habilitado</li>
                    <li>Timeouts padrão: 60s conexão, 30s greeting, 60s socket</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status do Serviço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Status do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Configurado:</Label>
              <Badge variant={emailStatus?.configured ? "default" : "destructive"}>
                {emailStatus?.configured ? "Sim" : "Não"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <Label>Serviço:</Label>
              <Badge variant="outline">{emailStatus?.service}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <Label>Usuário:</Label>
              <span className="text-sm font-mono">{emailStatus?.user}</span>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Conexão:
                {emailStatus?.connection.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </Label>
              <p className="text-sm text-muted-foreground">
                {emailStatus?.connection.message}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Teste de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Testar Envio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email de teste:</Label>
              <input
                id="test-email"
                type="email"
                placeholder="exemplo@email.com"
                value={testEmail}
                onChange={(e) => {
                  console.log("Native input change:", e.target.value);
                  setTestEmail(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    console.log("Enter pressed, sending test email");
                    handleTestEmail();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ pointerEvents: 'auto', userSelect: 'text' }}
              />
            </div>

            <button
              onClick={() => {
                console.log("Native button clicked!", { testEmail, isTestingEmail });
                handleTestEmail();
              }}
              disabled={isTestingEmail || !testEmail}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              style={{ pointerEvents: 'auto' }}
            >
              {isTestingEmail ? (
                "Enviando..."
              ) : (
                "Enviar Teste"
              )}
            </button>

            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Sobre o teste:</p>
                  <p className="text-muted-foreground">
                    Um email de teste será enviado para verificar se a configuração está funcionando corretamente.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações de Configuração */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Configuração Manual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Variáveis de Ambiente Atuais:</Label>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                <div>
                  <span className="text-blue-600 dark:text-blue-400">EMAIL_SERVICE</span>=
                  <span className="text-green-600 dark:text-green-400">
                    {envVars?.EMAIL_SERVICE || 'carregando...'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">EMAIL_USER</span>=
                  <span className="text-green-600 dark:text-green-400">
                    {envVars?.EMAIL_USER || 'carregando...'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">EMAIL_PASSWORD</span>=
                  <span className="text-green-600 dark:text-green-400">
                    {envVars?.EMAIL_PASSWORD || 'carregando...'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Serviços Suportados:</Label>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Gmail (recomendado)</li>
                <li>• Outlook/Hotmail</li>
                <li>• Yahoo</li>
                <li>• SendGrid</li>
                <li>• SMTP personalizado</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800">Nota Importante:</p>
                <p className="text-yellow-700">
                  Para Gmail, use uma senha de aplicativo em vez da senha normal. 
                  Configure a autenticação de 2 fatores e gere uma senha específica para aplicativos.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}