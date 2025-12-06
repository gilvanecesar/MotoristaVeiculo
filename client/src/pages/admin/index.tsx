import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, Megaphone } from "lucide-react";
import UsersManagement from "./users-management";
import DataManagement from "./data-management";

export default function AdminPage() {
  const [tab, setTab] = useState("users");
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Verificar se o usuário é um administrador
  useEffect(() => {
    if (user && user.profileType !== "admin") {
      toast({
        title: "Acesso restrito",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive",
      });
      navigate("/home");
    }
  }, [user, navigate, toast]);

  // Não renderizar nada enquanto verifica ou se não for admin
  if (!user || user.profileType !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Painel do Administrador</h2>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/user-search")} variant="outline" className="flex items-center gap-2">
            <Icons.search className="h-4 w-4" />
            Pesquisar Usuário
          </Button>
          <Button onClick={() => navigate("/admin/email")} variant="outline" className="flex items-center gap-2">
            <Icons.settings className="h-4 w-4" />
            Configurar Email
          </Button>
          <Button onClick={() => navigate("/admin/webhook-config")} variant="outline" className="flex items-center gap-2">
            <Icons.settings className="h-4 w-4" />
            Configurar Webhook
          </Button>
          <Button onClick={() => navigate("/admin/finance")} className="flex items-center gap-2">
            <Icons.dollarSign className="h-4 w-4" />
            Gestão Financeira
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">
            <Icons.user className="mr-2 h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="data-management">
            <Icons.database className="mr-2 h-4 w-4" />
            Gerenciamento de Dados
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Icons.activity className="mr-2 h-4 w-4" />
            Logs do Sistema
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Icons.settings className="mr-2 h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="data-management" className="space-y-4">
          <DataManagement />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Visualize os registros de atividades do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded h-[400px] p-4 overflow-auto bg-slate-50 dark:bg-slate-900">
                <p className="text-sm text-muted-foreground">
                  Ainda não há logs disponíveis.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Limpar Logs</Button>
              <Button variant="outline">Exportar</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Gerencie as configurações gerais do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Configuração de Email</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Configure e teste o serviço de envio de emails do sistema.
                  </p>
                  <Button onClick={() => navigate("/admin/email")} className="bg-blue-600 hover:bg-blue-700">
                    <Icons.settings className="mr-2 h-4 w-4" />
                    Configurar Email
                  </Button>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <h3 className="font-medium mb-2 text-purple-900 dark:text-purple-100">Integração N8N</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                    Configure webhook N8N para automação de processos e envio de dados.
                  </p>
                  <Button onClick={() => navigate("/admin/n8n")} className="bg-purple-600 hover:bg-purple-700">
                    <Icons.settings className="mr-2 h-4 w-4" />
                    Configurar N8N
                  </Button>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <h3 className="font-medium mb-2 text-orange-900 dark:text-orange-100">Campanhas WhatsApp</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                    Gerencie mensagens promocionais exibidas no compartilhamento de fretes.
                  </p>
                  <Button onClick={() => navigate("/admin/campaigns")} className="bg-orange-600 hover:bg-orange-700" data-testid="button-admin-campaigns">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Gerenciar Campanhas
                  </Button>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Backup do Banco de Dados</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie um backup completo de todos os dados do sistema.
                  </p>
                  <Button>
                    <Icons.download className="mr-2 h-4 w-4" />
                    Gerar Backup
                  </Button>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Restaurar Sistema</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Restaure o sistema a partir de um backup existente.
                  </p>
                  <Button variant="outline">
                    <Icons.upload className="mr-2 h-4 w-4" />
                    Restaurar Backup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}