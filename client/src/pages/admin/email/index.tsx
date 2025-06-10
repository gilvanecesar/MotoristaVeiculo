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

  // Buscar status do email
  const { data: emailStatus, isLoading } = useQuery<EmailStatus>({
    queryKey: ["/api/admin/email/status"],
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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

      <div className="grid gap-6 md:grid-cols-2">
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
              <Input
                id="test-email"
                type="email"
                placeholder="exemplo@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleTestEmail();
                  }
                }}
              />
            </div>

            <Button
              onClick={handleTestEmail}
              disabled={isTestingEmail || !testEmail}
              className="w-full"
            >
              {isTestingEmail ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Teste
                </>
              )}
            </Button>

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
              <Label className="text-sm font-semibold">Variáveis de Ambiente:</Label>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                <div>EMAIL_SERVICE=gmail</div>
                <div>EMAIL_USER=seu@email.com</div>
                <div>EMAIL_PASSWORD=sua_senha_app</div>
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